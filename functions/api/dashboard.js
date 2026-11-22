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
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const userId = authUser.user_id;

  try {
    // 1. Totais do Mês (Pagos vs Pendentes)
    const totalsRows = await env.DB.prepare(`
      SELECT type, status, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND date LIKE ?
      GROUP BY type, status
    `).bind(userId, `${month}%`).all();

    let paidIncome = 0;
    let pendingIncome = 0;
    let paidExpense = 0;
    let pendingExpense = 0;

    for (const r of (totalsRows.results || [])) {
      if (r.type === "income") {
        if (r.status === "pending") pendingIncome += Number(r.total) || 0;
        else paidIncome += Number(r.total) || 0;
      } else if (r.type === "expense") {
        if (r.status === "pending") pendingExpense += Number(r.total) || 0;
        else paidExpense += Number(r.total) || 0;
      }
    }

    const balance = paidIncome - paidExpense;
    const savingsRate = paidIncome > 0 ? Math.round(((paidIncome - paidExpense) / paidIncome) * 1000) / 10 : 0;

    // 2. Despesas por Categoria no Mês
    const catRes = await env.DB.prepare(`
      SELECT c.id, c.name, c.color, c.icon, COALESCE(SUM(t.amount), 0) as total_amount
      FROM categories c
      JOIN transactions t ON c.id = t.category_id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date LIKE ?
      GROUP BY c.id
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `).bind(userId, `${month}%`).all();

    const expensesByCategory = (catRes.results || []).map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      total_amount: Number(c.total_amount) || 0
    }));

    // 3. Histórico dos Últimos 6 Meses
    const [yr, mo] = month.split("-").map(Number);
    const monthsList = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(yr, mo - 1 - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsList.push(ym);
    }

    const minMonth = monthsList[0];
    const histRes = await env.DB.prepare(`
      SELECT substr(date, 1, 7) as ym, type, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND date >= ?
      GROUP BY ym, type
    `).bind(userId, `${minMonth}-01`).all();

    const histMap = {};
    monthsList.forEach(m => { histMap[m] = { month_period: m, income: 0, expense: 0 }; });
    for (const r of (histRes.results || [])) {
      if (histMap[r.ym]) {
        if (r.type === "income") histMap[r.ym].income += Number(r.total) || 0;
        else if (r.type === "expense") histMap[r.ym].expense += Number(r.total) || 0;
      }
    }
    const monthlyHistory = monthsList.map(m => histMap[m]);

    // 4. Status dos Orçamentos (Budgets)
    const budgetsRes = await env.DB.prepare(`
      SELECT b.id as budget_id, b.category_id, b.monthly_limit,
             c.name as category_name, c.icon as category_icon, c.color as category_color,
             COALESCE((
               SELECT SUM(t.amount)
               FROM transactions t
               WHERE t.user_id = b.user_id
                 AND t.category_id = b.category_id
                 AND t.type = 'expense'
                 AND t.date LIKE ?
             ), 0) as spent_amount
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.monthly_limit DESC
    `).bind(`${month}%`, userId).all();

    const budgetsStatus = (budgetsRes.results || []).map(b => {
      const limit = Number(b.monthly_limit) || 1;
      const spent = Number(b.spent_amount) || 0;
      const pct = Math.round((spent / limit) * 1000) / 10;
      return {
        budget_id: b.budget_id,
        category_id: b.category_id,
        category_name: b.category_name,
        category_icon: b.category_icon,
        category_color: b.category_color,
        monthly_limit: limit,
        spent_amount: spent,
        remaining: limit - spent,
        percentage: pct
      };
    });

    return new Response(JSON.stringify({
      month,
      totals: {
        total_income: paidIncome,
        total_expense: paidExpense,
        balance,
        pending_income: pendingIncome,
        pending_expense: pendingExpense,
        savings_rate: savingsRate
      },
      expenses_by_category: expensesByCategory,
      monthly_history: monthlyHistory,
      budgets_status: budgetsStatus
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
