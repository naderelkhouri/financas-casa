import { authenticateRequest } from "../auth/_utils.js";

export async function onRequestPost(context) {
  const { env, request } = context;

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { content } = await request.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Arquivo CSV vazio" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0 && /data|date|descri/i.test(line)) continue;

      const parts = line.split(/[,;]/).map(p => p.replace(/^"|"$/g, "").trim());
      if (parts.length < 3) continue;

      const rawDate = parts[0];
      const desc = parts[1] || "Importado via CSV";
      const rawVal = parseFloat(parts[parts.length - 1].replace(",", "."));
      if (isNaN(rawVal)) continue;

      let dateStr = new Date().toISOString().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        dateStr = rawDate;
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
        const [d, m, y] = rawDate.split("/");
        dateStr = `${y}-${m}-${d}`;
      }

      const type = rawVal < 0 ? "expense" : "income";
      const amount = Math.abs(rawVal);

      await env.DB.prepare(`
        INSERT INTO transactions (user_id, description, amount, type, payment_method, date, status, tags)
        VALUES (?, ?, ?, ?, 'CSV', ?, 'paid', 'csv')
      `).bind(authUser.user_id, desc, amount, type, dateStr).run();
      count++;
    }

    return new Response(JSON.stringify({ success: true, count }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
