import { authenticateRequest } from "./auth/_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);

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
    // 1. Total Receitas (Segregado por Usuário)
    const incomeRes = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'income' AND date LIKE ?
    `).bind(userId, `${month}%`).first();

    // 2. Total Despesas (Segregado por Usuário)
    const expenseRes = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' AND date LIKE ?
    `).bind(userId, `${month}%`).first();

    const income = incomeRes?.total || 0;
    const expense = expenseRes?.total || 0;
    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // 3. Distribuição por Categoria
    const catRes = await env.DB.prepare(`
      SELECT c.name, c.color, c.icon, COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = ? AND t.type = 'expense' AND t.date LIKE ?
      WHERE c.type = 'expense'
      GROUP BY c.id
      HAVING total > 0
      ORDER BY total DESC
    `).bind(userId, `${month}%`).all();

    return new Response(JSON.stringify({
      month,
      total_income: income,
      total_expense: expense,
      net_balance: balance,
      savings_rate: savingsRate,
      category_distribution: catRes.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
