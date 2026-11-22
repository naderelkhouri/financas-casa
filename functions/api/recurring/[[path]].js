import { authenticateRequest } from "../auth/_utils.js";

export async function onRequest(context) {
  const { env, request, params } = context;
  const pathParts = params.path || [];
  const billId = Number(pathParts[0]);
  const action = pathParts[1] || "";

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    if (request.method === "DELETE") {
      await env.DB.prepare(`DELETE FROM recurring_bills WHERE id = ? AND user_id = ?`)
        .bind(billId, authUser.user_id)
        .run();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST" && action === "pay") {
      const data = await request.json();
      const month = data.month || new Date().toISOString().slice(0, 7);

      const bill = await env.DB.prepare(`SELECT * FROM recurring_bills WHERE id = ? AND user_id = ?`)
        .bind(billId, authUser.user_id)
        .first();

      if (!bill) {
        return new Response(JSON.stringify({ error: "Conta fixa não encontrada" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }

      const paidDate = `${month}-${String(bill.due_day).padStart(2, "0")}`;
      let txId = null;

      if (data.create_transaction) {
        const txInsert = await env.DB.prepare(`
          INSERT INTO transactions (user_id, description, amount, type, category_id, payment_method, date, status, notes)
          VALUES (?, ?, ?, 'expense', ?, ?, ?, 'paid', 'Gerado por Conta Fixa')
        `).bind(
          authUser.user_id,
          bill.description,
          bill.amount,
          bill.category_id,
          bill.payment_method || "PIX",
          paidDate
        ).run();
        txId = txInsert.meta.last_row_id;
      }

      await env.DB.prepare(`
        INSERT OR REPLACE INTO recurring_payments (bill_id, month_year, paid_date, transaction_id)
        VALUES (?, ?, ?, ?)
      `).bind(billId, month, paidDate, txId).run();

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST" && action === "unpay") {
      const data = await request.json();
      const month = data.month || new Date().toISOString().slice(0, 7);

      await env.DB.prepare(`
        DELETE FROM recurring_payments WHERE bill_id = ? AND month_year = ?
      `).bind(billId, month).run();

      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Rota inválida" }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
