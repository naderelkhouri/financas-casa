import { authenticateRequest } from "./auth/_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 não vinculado" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const res = await env.DB.prepare(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.monthly_limit DESC
    `).bind(authUser.user_id).all();

    return new Response(JSON.stringify(res.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 não vinculado" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const data = await request.json();
    const categoryId = Number(data.category_id);
    const monthlyLimit = Number(data.monthly_limit);

    const existing = await env.DB.prepare(`
      SELECT id FROM budgets WHERE user_id = ? AND category_id = ?
    `).bind(authUser.user_id, categoryId).first();

    if (existing) {
      await env.DB.prepare(`
        UPDATE budgets SET monthly_limit = ? WHERE id = ? AND user_id = ?
      `).bind(monthlyLimit, existing.id, authUser.user_id).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO budgets (user_id, category_id, monthly_limit) VALUES (?, ?, ?)
      `).bind(authUser.user_id, categoryId, monthlyLimit).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
