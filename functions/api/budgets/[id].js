import { authenticateRequest } from "../auth/_utils.js";

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const budgetId = Number(params.id);

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    await env.DB.prepare(`DELETE FROM budgets WHERE id = ? AND user_id = ?`)
      .bind(budgetId, authUser.user_id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
