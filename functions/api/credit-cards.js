export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco D1 não vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const res = await env.DB.prepare(`
      SELECT * FROM credit_cards WHERE is_active = 1 ORDER BY name ASC
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
    const { name, credit_limit, closing_day, due_day, color } = data;

    const res = await env.DB.prepare(`
      INSERT INTO credit_cards (user_id, name, credit_limit, closing_day, due_day, color)
      VALUES (1, ?, ?, ?, ?, ?)
    `).bind(
      name,
      parseFloat(credit_limit) || 0,
      parseInt(closing_day) || 25,
      parseInt(due_day) || 5,
      color || '#6366f1'
    ).run();

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
