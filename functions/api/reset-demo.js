import { authenticateRequest } from "./auth/_utils.js";

export async function onRequestPost(context) {
  const { env, request } = context;

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const uid = authUser.user_id;
  const ym = new Date().toISOString().slice(0, 7);

  try {
    await env.DB.prepare("DELETE FROM transactions WHERE user_id = ?").bind(uid).run();

    const demoTxs = [
      [uid, "Remuneração Mensal / Pró-Labore", 12500.00, "income", 11, "Transferência", `${ym}-05`, "paid", "Recebimento mensal", "fixo"],
      [uid, "Aluguel & Condomínio", 3200.00, "expense", 1, "Boleto", `${ym}-10`, "paid", "Moradia principal", "fixo"],
      [uid, "Supermercado Mensal", 1450.80, "expense", 2, "Cartão de Crédito", `${ym}-12`, "paid", "Compras do mês", "mercado"],
      [uid, "Energia & Internet Fibra", 389.90, "expense", 8, "PIX", `${ym}-15`, "paid", "Contas de consumo", "fixo"]
    ];

    for (const tx of demoTxs) {
      await env.DB.prepare(`
        INSERT INTO transactions (user_id, description, amount, type, category_id, payment_method, date, status, notes, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(...tx).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
