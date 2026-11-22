import { authenticateRequest } from "../auth/_utils.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  const secret = env.JWT_SECRET || "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";
  const authUser = await authenticateRequest(request, secret);
  if (!authUser) {
    return new Response("Não autenticado", { status: 401 });
  }

  let query = `
    SELECT t.date, t.description, t.type, c.name as category, t.payment_method, t.status, t.amount, t.tags, t.notes
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params = [authUser.user_id];
  if (month) {
    query += ` AND t.date LIKE ?`;
    params.push(`${month}%`);
  }
  query += ` ORDER BY t.date DESC, t.id DESC`;

  const res = await env.DB.prepare(query).bind(...params).all();
  const rows = res.results || [];

  const header = "Data,Descricao,Tipo,Categoria,Forma_Pagamento,Status,Valor,Tags,Observacoes\n";
  const csvLines = rows.map(r => [
    r.date,
    `"${String(r.description || "").replace(/"/g, '""')}"`,
    r.type,
    `"${String(r.category || "Geral").replace(/"/g, '""')}"`,
    `"${String(r.payment_method || "").replace(/"/g, '""')}"`,
    r.status,
    Number(r.amount || 0).toFixed(2),
    `"${String(r.tags || "").replace(/"/g, '""')}"`,
    `"${String(r.notes || "").replace(/"/g, '""')}"`
  ].join(","));

  const csvContent = "\uFEFF" + header + csvLines.join("\n");
  const filename = `extrato-financeiro-${month || "completo"}.csv`;

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
