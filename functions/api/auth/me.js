import { authenticateRequest } from "./_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);

  if (!authUser) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const actorId = authUser.actor_id || authUser.user_id;

  if (env.DB) {
    const user = await env.DB.prepare(`
      SELECT id, name, email, plan, role, plan_expires_at, created_at
      FROM users
      WHERE id = ?
    `).bind(actorId).first();

    if (user) {
      const ws = await env.DB.prepare(`
        SELECT w.id, w.name, w.max_members, wm.member_role,
               (SELECT COUNT(*) FROM workspace_members c WHERE c.workspace_id = w.id) as member_count
        FROM workspace_members wm
        JOIN workspaces w ON wm.workspace_id = w.id
        WHERE wm.user_id = ?
        LIMIT 1
      `).bind(actorId).first();

      return new Response(JSON.stringify({
        authenticated: true,
        user: {
          ...user,
          workspace_id: ws ? ws.id : user.id,
          workspace_name: ws ? ws.name : `Workspace de ${user.name}`,
          member_role: ws ? ws.member_role : "owner",
          max_members: ws ? ws.max_members : 5,
          member_count: ws ? ws.member_count : 1
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ authenticated: true, user: authUser }), {
    headers: { "Content-Type": "application/json" }
  });
}
