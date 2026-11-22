import { authenticateRequest } from "./auth/_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const res = await env.DB.prepare(`
      SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC
    `).bind(authUser.user_id).all();

    const goals = (res.results || []).map(g => {
      const target = Number(g.target_amount) || 1;
      const current = Number(g.current_amount) || 0;
      const percentage = Math.round((current / target) * 1000) / 10;
      return { ...g, percentage };
    });

    return new Response(JSON.stringify(goals), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const data = await request.json();
    const { title, target_amount, current_amount, deadline, icon, notes } = data;

    const res = await env.DB.prepare(`
      INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, icon, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      authUser.user_id,
      title,
      Number(target_amount) || 0,
      Number(current_amount) || 0,
      deadline || null,
      icon || 'target',
      notes || ''
    ).run();

    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
