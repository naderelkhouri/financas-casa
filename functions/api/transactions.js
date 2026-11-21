import { authenticateRequest } from "./auth/_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco Cloudflare D1 não vinculado" }), {
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

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco Cloudflare D1 não vinculado" }), {
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
      type || 'expense',
      category_id || null,
      payment_method || 'PIX',
      date || new Date().toISOString().slice(0, 10),
      status || 'paid',
      notes || '',
      tags || ''
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
