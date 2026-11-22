import { authenticateRequest } from "./auth/_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const res = await env.DB.prepare(`
      SELECT r.*, c.name as category_name, c.icon as category_icon,
             (SELECT id FROM recurring_payments rp WHERE rp.bill_id = r.id AND rp.month_year = ?) as payment_id
      FROM recurring_bills r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.user_id = ? AND r.active = 1
      ORDER BY r.due_day ASC
    `).bind(month, authUser.user_id).all();

    const bills = (res.results || []).map(b => {
      const isPaid = Boolean(b.payment_id);
      return {
        ...b,
        is_paid: isPaid,
        status_class: isPaid ? "paid" : "pending",
        status_label: isPaid ? "Pago no Mês" : "Pendente"
      };
    });

    return new Response(JSON.stringify(bills), {
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
    const { description, amount, due_day, category_id, payment_method, notes } = data;

    const res = await env.DB.prepare(`
      INSERT INTO recurring_bills (user_id, description, amount, due_day, category_id, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      authUser.user_id,
      description,
      Number(amount) || 0,
      Number(due_day) || 10,
      category_id || null,
      payment_method || "PIX",
      notes || ""
    ).run();

    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
