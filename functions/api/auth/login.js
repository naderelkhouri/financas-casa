import { verifyPassword, createJWT } from "./_utils.js";

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Serviço de dados indisponível" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await request.json();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = await env.DB.prepare(`
      SELECT id, name, email, password_hash, plan, role, plan_expires_at
      FROM users
      WHERE email = ?
    `).bind(email).first();

    const dummyHash = "00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";
    const isValid = await verifyPassword(user ? user.password_hash : dummyHash, password);

    if (!user || !isValid) {
      return new Response(JSON.stringify({ error: "Credenciais incorretas. Verifique seu e-mail e senha." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Resolver Workspace do usuário (ou criar se ainda não existir, limite de 5 usuários)
    let membership = await env.DB.prepare(`
      SELECT wm.workspace_id, wm.member_role, w.name as workspace_name, w.max_members
      FROM workspace_members wm
      JOIN workspaces w ON wm.workspace_id = w.id
      WHERE wm.user_id = ?
      ORDER BY CASE wm.member_role WHEN 'owner' THEN 1 ELSE 2 END
      LIMIT 1
    `).bind(user.id).first();

    if (!membership) {
      const wsInsert = await env.DB.prepare(`
        INSERT INTO workspaces (name, owner_id, max_members)
        VALUES (?, ?, 5)
      `).bind(`Workspace de ${user.name}`, user.id).run();
      const wsId = wsInsert.meta.last_row_id;

      await env.DB.prepare(`
        INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, member_role)
        VALUES (?, ?, 'owner')
      `).bind(wsId, user.id).run();

      membership = {
        workspace_id: wsId,
        member_role: "owner",
        workspace_name: `Workspace de ${user.name}`,
        max_members: 5
      };
    }

    const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
    const token = await createJWT({
      user_id: membership.workspace_id,
      actor_id: user.id,
      workspace_id: membership.workspace_id,
      member_role: membership.member_role,
      role: user.role || "user",
      email: user.email,
      name: user.name,
      plan: user.plan
    }, secret);

    const cookieFlags = [
      `auth_token=${token}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      `Max-Age=${86400 * 7}`
    ].join("; ");

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role || "user",
        workspace_id: membership.workspace_id,
        workspace_name: membership.workspace_name,
        member_role: membership.member_role,
        max_members: membership.max_members || 5,
        plan_expires_at: user.plan_expires_at
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieFlags
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno no servidor de autenticação." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
