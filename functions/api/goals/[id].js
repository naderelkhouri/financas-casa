import { authenticateRequest } from "../auth/_utils.js";

export async function onRequestPut(context) {
  const { env, request, params } = context;
  const goalId = Number(params.id);

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const data = await request.json();
    const { title, target_amount, current_amount, deadline, icon, notes } = data;

    await env.DB.prepare(`
      UPDATE goals
      SET title = ?, target_amount = ?, current_amount = ?, deadline = ?, icon = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      title,
      Number(target_amount) || 0,
      Number(current_amount) || 0,
      deadline || null,
      icon || 'target',
      notes || '',
      goalId,
      authUser.user_id
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const goalId = Number(params.id);

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    await env.DB.prepare(`DELETE FROM goals WHERE id = ? AND user_id = ?`)
      .bind(goalId, authUser.user_id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
