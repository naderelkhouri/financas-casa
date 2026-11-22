import { authenticateRequest, hashPassword } from "./auth/_utils.js";

const MAX_WORKSPACE_USERS = 5;

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 indisponível" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const actorId = authUser.actor_id || authUser.user_id;
  const workspaceId = authUser.workspace_id || authUser.user_id;

  try {
    let ws = await env.DB.prepare(`
      SELECT id, name, owner_id, max_members, created_at
      FROM workspaces
      WHERE id = ?
    `).bind(workspaceId).first();

    if (!ws) {
      const ownerUser = await env.DB.prepare("SELECT id, name FROM users WHERE id = ?").bind(actorId).first();
      const wsName = `Workspace de ${ownerUser ? ownerUser.name : "Usuário"}`;
      await env.DB.prepare(`
        INSERT OR IGNORE INTO workspaces (id, name, owner_id, max_members)
        VALUES (?, ?, ?, ?)
      `).bind(workspaceId, wsName, actorId, MAX_WORKSPACE_USERS).run();

      await env.DB.prepare(`
        INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, member_role)
        VALUES (?, ?, 'owner')
      `).bind(workspaceId, actorId).run();

      ws = { id: workspaceId, name: wsName, owner_id: actorId, max_members: MAX_WORKSPACE_USERS };
    }

    const membersRes = await env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.plan, wm.member_role, wm.added_at
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = ?
      ORDER BY CASE wm.member_role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, wm.added_at ASC
    `).bind(ws.id).all();

    const members = membersRes.results || [];
    const maxMembers = Math.min(Number(ws.max_members) || MAX_WORKSPACE_USERS, MAX_WORKSPACE_USERS);
    const myMembership = members.find(m => m.id === actorId);

    return new Response(JSON.stringify({
      workspace: {
        id: ws.id,
        name: ws.name,
        owner_id: ws.owner_id,
        max_members: maxMembers,
        member_count: members.length,
        available_seats: Math.max(0, maxMembers - members.length),
        current_user_role: myMembership ? myMembership.member_role : "member"
      },
      members
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 indisponível" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const actorId = authUser.actor_id || authUser.user_id;
  const workspaceId = authUser.workspace_id || authUser.user_id;

  try {
    const data = await request.json();
    const action = data.action || "add_member";

    // Verificar permissão do usuário atual no workspace
    const callerMember = await env.DB.prepare(`
      SELECT member_role FROM workspace_members WHERE workspace_id = ? AND user_id = ?
    `).bind(workspaceId, actorId).first();

    if (!callerMember || (callerMember.member_role !== "owner" && callerMember.member_role !== "admin")) {
      return new Response(JSON.stringify({ error: "Apenas o proprietário ou co-administrador do workspace pode gerenciar membros." }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ws = await env.DB.prepare("SELECT * FROM workspaces WHERE id = ?").bind(workspaceId).first();
    const maxMembers = Math.min(Number(ws?.max_members) || MAX_WORKSPACE_USERS, MAX_WORKSPACE_USERS);

    // 1. Renomear Workspace
    if (action === "rename") {
      const newName = String(data.name || "").trim();
      if (!newName || newName.length < 2 || newName.length > 80) {
        return new Response(JSON.stringify({ error: "Nome do workspace deve ter entre 2 e 80 caracteres." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      await env.DB.prepare("UPDATE workspaces SET name = ? WHERE id = ?").bind(newName, workspaceId).run();
      return new Response(JSON.stringify({ success: true, message: "Nome do workspace atualizado com sucesso." }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Remover Membro do Workspace
    if (action === "remove_member") {
      const targetUserId = Number(data.user_id);
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "ID do usuário é obrigatório." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      if (ws && targetUserId === ws.owner_id) {
        return new Response(JSON.stringify({ error: "Não é possível remover o proprietário titular do workspace." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      await env.DB.prepare(`
        DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?
      `).bind(workspaceId, targetUserId).run();

      return new Response(JSON.stringify({ success: true, message: "Usuário removido do workspace." }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Adicionar Membro (Com trava estrita de até 5 usuários por workspace)
    const countRes = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM workspace_members WHERE workspace_id = ?
    `).bind(workspaceId).first();

    const currentCount = Number(countRes?.total) || 0;
    if (currentCount >= maxMembers) {
      return new Response(JSON.stringify({
        error: `Limite máximo atingido: cada workspace pode ter até ${maxMembers} usuários (${currentCount}/${maxMembers} ocupados).`
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    const memberRole = data.member_role === "admin" ? "admin" : "member";

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ error: "Informe o nome do membro (mínimo 2 caracteres)." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Informe um e-mail válido." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Verificar se usuário já existe na base
    let targetUser = await env.DB.prepare("SELECT id, name, email FROM users WHERE email = ?").bind(email).first();

    if (!targetUser) {
      if (password.length < 8) {
        return new Response(JSON.stringify({ error: "A senha inicial para o novo usuário deve ter no mínimo 8 caracteres." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const passwordHash = await hashPassword(password);
      const userInsert = await env.DB.prepare(`
        INSERT INTO users (name, email, password_hash, plan, role)
        VALUES (?, ?, ?, 'free', 'user')
      `).bind(name, email, passwordHash).run();

      targetUser = { id: userInsert.meta.last_row_id, name, email };
    } else {
      const alreadyMember = await env.DB.prepare(`
        SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?
      `).bind(workspaceId, targetUser.id).first();

      if (alreadyMember) {
        return new Response(JSON.stringify({ error: "Este usuário já faz parte deste workspace." }), { status: 409, headers: { "Content-Type": "application/json" } });
      }
    }

    await env.DB.prepare(`
      INSERT INTO workspace_members (workspace_id, user_id, member_role)
      VALUES (?, ?, ?)
    `).bind(workspaceId, targetUser.id, memberRole).run();

    return new Response(JSON.stringify({
      success: true,
      message: `${name} adicionado(a) ao workspace (${currentCount + 1}/${maxMembers} usuários).`,
      member: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        member_role: memberRole
      }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
