import { hashPassword, createJWT } from "./_utils.js";

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Serviço de dados indisponível" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const signupSetting = await env.DB.prepare(
      "SELECT value FROM system_settings WHERE key = 'allow_signup'"
    ).first();

    if (signupSetting && signupSetting.value === 'false') {
      return new Response(JSON.stringify({
        error: "Novos cadastros estão temporariamente suspensos pela administração do sistema."
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await request.json();
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    if (!name || name.length < 2 || name.length > 80) {
      return new Response(JSON.stringify({ error: "Nome deve conter entre 2 e 80 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "E-mail inválido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "A senha deve conter no mínimo 8 caracteres." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) {
      return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado no sistema." }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    const passwordHash = await hashPassword(password);

    const userInsert = await env.DB.prepare(`
      INSERT INTO users (name, email, password_hash, plan)
      VALUES (?, ?, ?, 'free')
    `).bind(name, email, passwordHash).run();

    const userId = userInsert.meta.last_row_id;

    // Criar Workspace exclusivo com capacidade para até 5 usuários
    const wsName = `Workspace de ${name}`;
    const wsInsert = await env.DB.prepare(`
      INSERT INTO workspaces (name, owner_id, max_members)
      VALUES (?, ?, 5)
    `).bind(wsName, userId).run();
    const workspaceId = wsInsert.meta.last_row_id;

    await env.DB.prepare(`
      INSERT INTO workspace_members (workspace_id, user_id, member_role)
      VALUES (?, ?, 'owner')
    `).bind(workspaceId, userId).run();

    await env.DB.prepare(`
      INSERT INTO accounts (user_id, name, account_type, color)
      VALUES (?, 'Carteira Principal', 'checking', '#10b981')
    `).bind(workspaceId).run();

    const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
    const token = await createJWT({
      user_id: workspaceId,
      actor_id: userId,
      workspace_id: workspaceId,
      member_role: "owner",
      role: "user",
      email,
      name,
      plan: "free"
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
        id: userId,
        name,
        email,
        plan: "free",
        role: "user",
        workspace_id: workspaceId,
        workspace_name: wsName,
        member_role: "owner",
        max_members: 5
      }
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieFlags
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno ao processar cadastro." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
