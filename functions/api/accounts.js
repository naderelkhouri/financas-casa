export async function onRequestGet(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 não vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const res = await env.DB.prepare(`
      SELECT * FROM accounts WHERE is_active = 1 ORDER BY name ASC
    `).all();

    return new Response(JSON.stringify(res.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 não vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await request.json();
    const { name, account_type, initial_balance, color } = data;
    const balance = parseFloat(initial_balance) || 0;

    const res = await env.DB.prepare(`
      INSERT INTO accounts (user_id, name, account_type, initial_balance, current_balance, color)
      VALUES (1, ?, ?, ?, ?, ?)
    `).bind(name, account_type || 'checking', balance, balance, color || '#10b981').run();

    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
