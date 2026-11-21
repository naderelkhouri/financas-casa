import { hashPassword, createJWT } from "./_utils.js";

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Serviço de dados indisponível" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await request.json();
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    // 1. Validações estritas de entrada
    if (!name || name.length < 2 || name.length > 80) {
      return new Response(JSON.stringify({ error: "Nome deve conter entre 2 e 80 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "E-mail inválido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "A senha deve conter no mínimo 8 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Verificar duplicidade de e-mail
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado no sistema." }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Hash PBKDF2
    const passwordHash = await hashPassword(password);

    // 4. Inserção do usuário
    const userInsert = await env.DB.prepare(`
      INSERT INTO users (name, email, password_hash, plan)
      VALUES (?, ?, ?, 'free')
    `).bind(name, email, passwordHash).run();

    const userId = userInsert.meta.last_row_id;

    // 5. Criar conta padrão 'Carteira' para o novo usuário
    await env.DB.prepare(`
      INSERT INTO accounts (user_id, name, account_type, color)
      VALUES (?, 'Carteira Principal', 'checking', '#10b981')
    `).bind(userId).run();

    // 6. Gerar JWT e Cookie HttpOnly Seguro
    const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
    const token = await createJWT({ user_id: userId, email: email, name: name, plan: "free" }, secret);

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
