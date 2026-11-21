import { verifyPassword, createJWT } from "./_utils.js";

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
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. Busca do usuário
    const user = await env.DB.prepare(`
      SELECT id, name, email, password_hash, plan, plan_expires_at 
      FROM users 
      WHERE email = ?
    `).bind(email).first();

    // 2. Proteção contra enumeração de usuários (tempo similar)
    const dummyHash = "00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";
    const isValid = await verifyPassword(user ? user.password_hash : dummyHash, password);

    if (!user || !isValid) {
      return new Response(JSON.stringify({ error: "Credenciais incorretas. Verifique seu e-mail e senha." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Gerar JWT e Cookie HttpOnly Seguro
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
    return new Response(JSON.stringify({ error: "Erro interno no servidor de autenticação." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
