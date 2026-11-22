import { authenticateRequest } from "../auth/_utils.js";

export async function onRequestPut(context) {
  const { env, request, params } = context;
  const txId = Number(params.id);

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 não vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await request.json();
    const { description, amount, type, category_id, payment_method, date, status, notes, tags } = data;

    await env.DB.prepare(`
      UPDATE transactions
      SET description = ?, amount = ?, type = ?, category_id = ?, payment_method = ?, date = ?, status = ?, notes = ?, tags = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      description,
      Number(amount) || 0,
      type || 'expense',
      category_id || null,
      payment_method || 'PIX',
      date,
      status || 'paid',
      notes || '',
      tags || '',
      txId,
      authUser.user_id
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const txId = Number(params.id);

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 não vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    await env.DB.prepare(`DELETE FROM transactions WHERE id = ? AND user_id = ?`)
      .bind(txId, authUser.user_id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
