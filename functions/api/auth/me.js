import { authenticateRequest } from "./_utils.js";

export async function onRequestGet(context) {
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
