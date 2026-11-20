export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const data = await request.json();
    const eventType = data.event || data.status;
    const metadata = data.metadata || {};
    const userId = metadata.user_id;
    const plan = metadata.plan || 'pro_monthly';

    if (env.DB && userId && (eventType === 'charge.paid' || eventType === 'paid' || eventType === 'confirmed')) {
      await env.DB.prepare(`
        UPDATE users SET plan = ?, plan_expires_at = datetime('now', '+30 days') WHERE id = ?
      `).bind(plan, userId).run();
    }

    return new Response(JSON.stringify({ received: true, event: eventType }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
