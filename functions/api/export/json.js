import { authenticateRequest } from "../auth/_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response("Não autenticado", { status: 401 });
  }

  const uid = authUser.user_id;
  const [txs, accs, cards, budgets, goals, recurring] = await Promise.all([
    env.DB.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC").bind(uid).all(),
    env.DB.prepare("SELECT * FROM accounts WHERE user_id = ?").bind(uid).all(),
    env.DB.prepare("SELECT * FROM credit_cards WHERE user_id = ?").bind(uid).all(),
    env.DB.prepare("SELECT * FROM budgets WHERE user_id = ?").bind(uid).all(),
    env.DB.prepare("SELECT * FROM goals WHERE user_id = ?").bind(uid).all(),
    env.DB.prepare("SELECT * FROM recurring_bills WHERE user_id = ?").bind(uid).all()
  ]);

  const backup = {
    exported_at: new Date().toISOString(),
    user: { id: uid, email: authUser.email, name: authUser.name },
    accounts: accs.results || [],
    credit_cards: cards.results || [],
    budgets: budgets.results || [],
    goals: goals.results || [],
    recurring_bills: recurring.results || [],
    transactions: txs.results || []
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-financas-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
