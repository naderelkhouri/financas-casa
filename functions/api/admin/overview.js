import { authenticateRequest } from "../auth/_utils.js";

// Endpoint de Métricas Globais e Lista de Usuários do SaaS (Acesso Restrito: role = 'admin')
export async function onRequestGet(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Serviço D1 indisponível" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);

  // 1. Verificação de Permissão RBAC (Zero Trust)
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Acesso não autorizado. Faça login." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Validar se o usuário tem a role 'admin' no banco
  const dbUser = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(authUser.user_id).first();
  if (!dbUser || dbUser.role !== 'admin') {
    return new Response(JSON.stringify({ error: "Acesso proibido. Requer privilégios de Administrador." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 2. Métricas do SaaS (MRR, Usuários, Lançamentos)
    const totalUsersRes = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    const proUsersRes = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE plan LIKE 'pro%'").first();
    const totalTxRes = await env.DB.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as volume FROM transactions").first();

    const totalUsers = totalUsersRes?.count || 0;
    const proUsers = proUsersRes?.count || 0;
    const mrrEstimated = proUsers * 19.90; // R$ 19,90/mês
    const totalTransactions = totalTxRes?.count || 0;
    const totalVolume = totalTxRes?.volume || 0;

    // 3. Listagem de Usuários Cadastrados
    const usersList = await env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.plan, u.role, u.created_at,
             (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) as tx_count,
             (SELECT COUNT(*) FROM accounts a WHERE a.user_id = u.id) as accounts_count
      FROM users u
      ORDER BY u.id DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({
      metrics: {
        total_users: totalUsers,
        pro_subscribers: proUsers,
        free_users: totalUsers - proUsers,
        estimated_mrr: mrrEstimated,
        total_transactions: totalTransactions,
        total_financial_volume: totalVolume
      },
      users: usersList.results || []
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

// Alteração de Plano ou Role de um Usuário pelo Administrador
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Serviço D1 indisponível" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);

  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const dbUser = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(authUser.user_id).first();
  if (!dbUser || dbUser.role !== 'admin') {
    return new Response(JSON.stringify({ error: "Requer papel de Administrador" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    const data = await request.json();
    const targetUserId = parseInt(data.user_id);
    const newPlan = data.plan;
    const newRole = data.role;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "user_id obrigatório" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (newPlan) {
      await env.DB.prepare("UPDATE users SET plan = ? WHERE id = ?").bind(newPlan, targetUserId).run();
    }
    if (newRole) {
      await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(newRole, targetUserId).run();
    }

    return new Response(JSON.stringify({ success: true, message: "Usuário atualizado pelo administrador." }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
