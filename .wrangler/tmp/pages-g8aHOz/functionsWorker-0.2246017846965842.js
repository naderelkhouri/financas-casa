var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/auth/_utils.js
var JWT_SECRET_DEFAULT = "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(storedHash, providedPassword) {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [saltHex, expectedHashHex] = parts;
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(providedPassword),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 1e5,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    const derivedHashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (derivedHashHex.length !== expectedHashHex.length) return false;
    let match2 = 0;
    for (let i = 0; i < derivedHashHex.length; i++) {
      match2 |= derivedHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return match2 === 0;
  } catch (err) {
    return false;
  }
}
__name(verifyPassword, "verifyPassword");
async function createJWT(payload, secret = JWT_SECRET_DEFAULT) {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const tokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1e3) + 86400 * 7,
    // 7 dias de validade
    iat: Math.floor(Date.now() / 1e3)
  };
  const b64Header = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const b64Payload = btoa(JSON.stringify(tokenPayload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = encoder.encode(`${b64Header}.${b64Payload}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const b64Signature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64Header}.${b64Payload}.${b64Signature}`;
}
__name(createJWT, "createJWT");
async function verifyJWT(token, secret = JWT_SECRET_DEFAULT) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, b64Signature] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${b64Header}.${b64Payload}`);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    let base64 = b64Signature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!isValid) return null;
    let payloadStr = b64Payload.replace(/-/g, "+").replace(/_/g, "/");
    while (payloadStr.length % 4) payloadStr += "=";
    const payload = JSON.parse(atob(payloadStr));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function authenticateRequest(request, secret = JWT_SECRET_DEFAULT) {
  const cookieHeader = request.headers.get("Cookie") || "";
  let token = null;
  const match2 = cookieHeader.match(/auth_token=([^;]+)/);
  if (match2) {
    token = match2[1];
  }
  if (!token) {
    const authHeader = request.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  if (!token) return null;
  return await verifyJWT(token, secret);
}
__name(authenticateRequest, "authenticateRequest");

// api/admin/overview.js
async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Servi\xE7o D1 indispon\xEDvel" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Acesso n\xE3o autorizado. Fa\xE7a login." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const dbUser = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(authUser.user_id).first();
  if (!dbUser || dbUser.role !== "admin") {
    return new Response(JSON.stringify({ error: "Acesso proibido. Requer privil\xE9gios de Administrador." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const totalUsersRes = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    const proUsersRes = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE plan LIKE 'pro%'").first();
    const totalTxRes = await env.DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as volume FROM transactions").first();
    const totalUsers = totalUsersRes?.count || 0;
    const proUsers = proUsersRes?.count || 0;
    const mrrEstimated = proUsers * 19.9;
    const totalTransactions = totalTxRes?.count || 0;
    const totalVolume = totalTxRes?.volume || 0;
    const usersList = await env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.plan, u.role, u.created_at,
             (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) as tx_count,
             (SELECT COUNT(*) FROM accounts a WHERE a.user_id = u.id) as accounts_count
      FROM users u
      ORDER BY u.id DESC
      LIMIT 100
    `).all();
    return new Response(JSON.stringify({
      metrics: {
        total_users: totalUsers,
        pro_subscribers: proUsers,
        free_users: totalUsers - proUsers,
        estimated_mrr: mrrEstimated,
        total_transactions: totalTransactions,
        total_financial_volume: totalVolume
      },
      users: usersList.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Servi\xE7o D1 indispon\xEDvel" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "N\xE3o autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const dbUser = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(authUser.user_id).first();
  if (!dbUser || dbUser.role !== "admin") {
    return new Response(JSON.stringify({ error: "Requer papel de Administrador" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }
  try {
    const data = await request.json();
    const targetUserId = parseInt(data.user_id);
    const newPlan = data.plan;
    const newRole = data.role;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "user_id obrigat\xF3rio" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (newPlan) {
      await env.DB.prepare("UPDATE users SET plan = ? WHERE id = ?").bind(newPlan, targetUserId).run();
    }
    if (newRole) {
      await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(newRole, targetUserId).run();
    }
    return new Response(JSON.stringify({ success: true, message: "Usu\xE1rio atualizado pelo administrador." }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequestPost, "onRequestPost");

// api/auth/login.js
async function onRequestPost2(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Servi\xE7o de dados indispon\xEDvel" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const data = await request.json();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "E-mail e senha s\xE3o obrigat\xF3rios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(`
      SELECT id, name, email, password_hash, plan, plan_expires_at 
      FROM users 
      WHERE email = ?
    `).bind(email).first();
    const dummyHash = "00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";
    const isValid = await verifyPassword(user ? user.password_hash : dummyHash, password);
    if (!user || !isValid) {
      return new Response(JSON.stringify({ error: "Credenciais incorretas. Verifique seu e-mail e senha." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
    const token = await createJWT({
      user_id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan
    }, secret);
    const cookieFlags = [
      `auth_token=${token}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      `Max-Age=${86400 * 7}`
    ].join("; ");
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        plan_expires_at: user.plan_expires_at
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieFlags
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno no servidor de autentica\xE7\xE3o." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/auth/logout.js
async function onRequestPost3() {
  const cookieFlags = [
    "auth_token=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ].join("; ");
  return new Response(JSON.stringify({ success: true, message: "Sess\xE3o encerrada com sucesso." }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieFlags
    }
  });
}
__name(onRequestPost3, "onRequestPost");

// api/auth/me.js
async function onRequestGet2(context) {
  const { env, request } = context;
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (env.DB) {
    const user = await env.DB.prepare(`
      SELECT id, name, email, plan, plan_expires_at, created_at 
      FROM users 
      WHERE id = ?
    `).bind(authUser.user_id).first();
    if (user) {
      return new Response(JSON.stringify({ authenticated: true, user }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  return new Response(JSON.stringify({ authenticated: true, user: authUser }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequestGet2, "onRequestGet");

// api/auth/register.js
async function onRequestPost4(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Servi\xE7o de dados indispon\xEDvel" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const data = await request.json();
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    if (!name || name.length < 2 || name.length > 80) {
      return new Response(JSON.stringify({ error: "Nome deve conter entre 2 e 80 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "E-mail inv\xE1lido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "A senha deve conter no m\xEDnimo 8 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return new Response(JSON.stringify({ error: "Este e-mail j\xE1 est\xE1 cadastrado no sistema." }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }
    const passwordHash = await hashPassword(password);
    const userInsert = await env.DB.prepare(`
      INSERT INTO users (name, email, password_hash, plan)
      VALUES (?, ?, ?, 'free')
    `).bind(name, email, passwordHash).run();
    const userId = userInsert.meta.last_row_id;
    await env.DB.prepare(`
      INSERT INTO accounts (user_id, name, account_type, color)
      VALUES (?, 'Carteira Principal', 'checking', '#10b981')
    `).bind(userId).run();
    const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
    const token = await createJWT({ user_id: userId, email, name, plan: "free" }, secret);
    const cookieFlags = [
      `auth_token=${token}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      `Max-Age=${86400 * 7}`
    ].join("; ");
    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, name, email, plan: "free" }
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieFlags
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno ao processar cadastro." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost4, "onRequestPost");

// api/bunkerpay/checkout.js
async function onRequestPost5(context) {
  const { env, request } = context;
  try {
    const data = await request.json();
    const plan = data.plan || "pro_monthly";
    const amount = plan === "pro_annual" ? 179 : 19.9;
    const chargeId = `bunker_cf_${Date.now()}`;
    const pixCopyPaste = `00020126580014br.gov.bcb.pix0136${chargeId}520400005303986540${amount.toFixed(2)}5802BR5915BUNKERPAY_SAAS6009SAO_PAULO62070503***6304ABCD`;
    return new Response(JSON.stringify({
      status: "pending",
      charge_id: chargeId,
      amount,
      currency: "BRL",
      plan,
      pix_copy_paste: pixCopyPaste,
      expires_in_minutes: 30,
      sandbox: true
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost5, "onRequestPost");

// api/bunkerpay/webhook.js
async function onRequestPost6(context) {
  const { env, request } = context;
  try {
    const data = await request.json();
    const eventType = data.event || data.status;
    const metadata = data.metadata || {};
    const userId = metadata.user_id;
    const plan = metadata.plan || "pro_monthly";
    if (env.DB && userId && (eventType === "charge.paid" || eventType === "paid" || eventType === "confirmed")) {
      await env.DB.prepare(`
        UPDATE users SET plan = ?, plan_expires_at = datetime('now', '+30 days') WHERE id = ?
      `).bind(plan, userId).run();
    }
    return new Response(JSON.stringify({ received: true, event: eventType }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost6, "onRequestPost");

// api/import/ofx.js
var KEYWORD_RULES = [
  { match: /mercado|supermercado|carrefour|extra|pao de acucar|assai|atacad|hortifruti|acougue/i, name: "Alimenta\xE7\xE3o & Mercado" },
  { match: /ifood|ubereats|rappi|restaurante|burger|mcdonald|subway|pizza|bar |lanche/i, name: "Lazer & Restaurantes" },
  { match: /posto|gasolina|combust|shell|ipiranga|br distribuidora|uber\*|99app|estapar|sem parar|estacionamento/i, name: "Transporte & Combust\xEDvel" },
  { match: /farmacia|droga|drogaria|panvel|pacheco|raia|medic|hospital|laborat|consulta/i, name: "Sa\xFAde & Farm\xE1cia" },
  { match: /netflix|spotify|amazon prime|disney|hbo|apple\.com|youtube|globo|openai|chatgpt/i, name: "Assinaturas & Streaming" },
  { match: /enel|sabesp|cemig|copel|light|cpfl|energia|vivo|claro|tim|oi|internet|condominio/i, name: "Contas (\xC1gua, Luz, Internet)" },
  { match: /aluguel|imobiliaria|quintoandar|iptu/i, name: "Moradia" },
  { match: /mercado livre|amazon|shopee|shein|magalu|aliexpress|zara|renner|riachuelo/i, name: "Vestu\xE1rio & Compras" },
  { match: /salario|pro labore|remuneracao|pagamento recebido/i, name: "Sal\xE1rio" },
  { match: /rendimento|dividendos|juros|tesouro|cdi|selic|invest/i, name: "Rendimentos & Investimentos" }
];
async function onRequestPost7(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco Cloudflare D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "financas-secret-dev-key-2026";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    const data = await request.json();
    const content = data.content || "";
    if (!content) {
      return new Response(JSON.stringify({ error: "Conte\xFAdo do extrato est\xE1 vazio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const catQuery = await env.DB.prepare("SELECT id, name, type FROM categories").all();
    const catList = catQuery.results || [];
    const catByName = {};
    catList.forEach((c) => {
      catByName[c.name] = c.id;
    });
    const bankMatch = content.match(/<BANKID>([^<\r\n]+)/i);
    const bankId = bankMatch ? bankMatch[1].trim() : "Extrato Banc\xE1rio";
    const trnBlocks = content.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|<STMTTRN>|$)/gi) || [];
    let importedCount = 0;
    let autoCategorizedCount = 0;
    for (const block of trnBlocks) {
      const dtMatch = block.match(/<DTPOSTED>([^<\r\n]+)/i);
      const amtMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
      const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
      const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);
      const fitidMatch = block.match(/<FITID>([^<\r\n]+)/i);
      if (!amtMatch) continue;
      const rawAmt = amtMatch[1].trim().replace(",", ".");
      const val = parseFloat(rawAmt);
      if (isNaN(val)) continue;
      const isExpense = val < 0;
      const amount = Math.abs(val);
      const desc = memoMatch ? memoMatch[1].trim() : nameMatch ? nameMatch[1].trim() : "Transa\xE7\xE3o OFX";
      const fitid = fitidMatch ? fitidMatch[1].trim() : "";
      if (fitid) {
        const existing = await env.DB.prepare(
          "SELECT id FROM transactions WHERE user_id = ? AND notes LIKE ?"
        ).bind(userId, `%FITID: ${fitid}%`).first();
        if (existing) continue;
      }
      let assignedCategoryId = null;
      for (const rule of KEYWORD_RULES) {
        if (rule.match.test(desc)) {
          if (catByName[rule.name]) {
            assignedCategoryId = catByName[rule.name];
            autoCategorizedCount++;
            break;
          }
        }
      }
      if (!assignedCategoryId) {
        assignedCategoryId = isExpense ? catByName["Outras Despesas"] : catByName["Rendimentos & Investimentos"];
      }
      let txDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      if (dtMatch) {
        const dStr = dtMatch[1].trim().replace(/\[.*\]/, "");
        if (dStr.length >= 8) {
          txDate = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
        }
      }
      await env.DB.prepare(`
        INSERT INTO transactions (user_id, description, amount, type, category_id, payment_method, date, status, notes, tags)
        VALUES (?, ?, ?, ?, ?, 'Extrato Banc\xE1rio', ?, 'paid', ?, 'ofx,importado')
      `).bind(
        userId,
        desc,
        amount,
        isExpense ? "expense" : "income",
        assignedCategoryId || null,
        txDate,
        `OFX FITID: ${fitid}`
      ).run();
      importedCount++;
    }
    return new Response(JSON.stringify({
      success: true,
      imported_count: importedCount,
      auto_categorized: autoCategorizedCount,
      bank_id: bankId
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost7, "onRequestPost");

// api/accounts.js
async function onRequestGet3(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    const res = await env.DB.prepare(`
      SELECT * FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY name ASC
    `).bind(userId).all();
    return new Response(JSON.stringify(res.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPost8(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    const data = await request.json();
    const { name, account_type, initial_balance, color } = data;
    const balance = parseFloat(initial_balance) || 0;
    const res = await env.DB.prepare(`
      INSERT INTO accounts (user_id, name, account_type, initial_balance, current_balance, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, name, account_type || "checking", balance, balance, color || "#10b981").run();
    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost8, "onRequestPost");

// api/categories.js
async function onRequestGet4(context) {
  const { env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const res = await env.DB.prepare(`
      SELECT * FROM categories ORDER BY type DESC, name ASC
    `).all();
    return new Response(JSON.stringify(res.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet4, "onRequestGet");
async function onRequestPost9(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const data = await request.json();
    const { name, type, color, icon } = data;
    const res = await env.DB.prepare(`
      INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)
    `).bind(name, type || "expense", color || "#64748b", icon || "\u{1F4C1}").run();
    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost9, "onRequestPost");

// api/credit-cards.js
async function onRequestGet5(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    const res = await env.DB.prepare(`
      SELECT * FROM credit_cards WHERE user_id = ? AND is_active = 1 ORDER BY name ASC
    `).bind(userId).all();
    return new Response(JSON.stringify(res.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet5, "onRequestGet");
async function onRequestPost10(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    const data = await request.json();
    const { name, credit_limit, closing_day, due_day, color } = data;
    const res = await env.DB.prepare(`
      INSERT INTO credit_cards (user_id, name, credit_limit, closing_day, due_day, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      name,
      parseFloat(credit_limit) || 0,
      parseInt(closing_day) || 25,
      parseInt(due_day) || 5,
      color || "#6366f1"
    ).run();
    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost10, "onRequestPost");

// api/dashboard.js
async function onRequestGet6(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco Cloudflare D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    const incomeRes = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'income' AND date LIKE ?
    `).bind(userId, `${month}%`).first();
    const expenseRes = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' AND date LIKE ?
    `).bind(userId, `${month}%`).first();
    const income = incomeRes?.total || 0;
    const expense = expenseRes?.total || 0;
    const balance = income - expense;
    const savingsRate = income > 0 ? (income - expense) / income * 100 : 0;
    const catRes = await env.DB.prepare(`
      SELECT c.name, c.color, c.icon, COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = ? AND t.type = 'expense' AND t.date LIKE ?
      WHERE c.type = 'expense'
      GROUP BY c.id
      HAVING total > 0
      ORDER BY total DESC
    `).bind(userId, `${month}%`).all();
    return new Response(JSON.stringify({
      month,
      total_income: income,
      total_expense: expense,
      net_balance: balance,
      savings_rate: savingsRate,
      category_distribution: catRes.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet6, "onRequestGet");

// api/transactions.js
async function onRequestGet7(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco Cloudflare D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];
    if (month) {
      query += ` AND t.date LIKE ?`;
      params.push(`${month}%`);
    }
    query += ` ORDER BY t.date DESC, t.id DESC`;
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();
    return new Response(JSON.stringify(result.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet7, "onRequestGet");
async function onRequestPost11(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco Cloudflare D1 n\xE3o vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;
  try {
    const data = await request.json();
    const { description, amount, type, category_id, payment_method, date, status, notes, tags } = data;
    const res = await env.DB.prepare(`
      INSERT INTO transactions (user_id, description, amount, type, category_id, payment_method, date, status, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      description,
      amount,
      type || "expense",
      category_id || null,
      payment_method || "PIX",
      date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      status || "paid",
      notes || "",
      tags || ""
    ).run();
    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost11, "onRequestPost");

// ../.wrangler/tmp/pages-g8aHOz/functionsRoutes-0.7745032538577579.mjs
var routes = [
  {
    routePath: "/api/admin/overview",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/overview",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/auth/register",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/bunkerpay/checkout",
    mountPath: "/api/bunkerpay",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/bunkerpay/webhook",
    mountPath: "/api/bunkerpay",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/import/ofx",
    mountPath: "/api/import",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/accounts",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/accounts",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/categories",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/categories",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/credit-cards",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/credit-cards",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/dashboard",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/transactions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/transactions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  }
];

// ../../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function getOriginalPathPrefix(requestPath, normalizedPrefix) {
  let end = 0;
  for (let index = 0; index < normalizedPrefix.length; index++) {
    end++;
    if (normalizedPrefix[index] === "/") {
      while (requestPath[end] === "/") {
        end++;
      }
    }
  }
  return requestPath.slice(0, end);
}
__name(getOriginalPathPrefix, "getOriginalPathPrefix");
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  const normalizedRequestPath = requestPath.replace(/\/+/g, "/");
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath) || routeMatcher(normalizedRequestPath);
    const originalMountMatch = mountMatcher(requestPath);
    const mountMatchResult = originalMountMatch || mountMatcher(normalizedRequestPath);
    if (matchResult && mountMatchResult) {
      const path = originalMountMatch ? originalMountMatch.path : getOriginalPathPrefix(requestPath, mountMatchResult.path);
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
