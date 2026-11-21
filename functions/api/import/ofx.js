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
    const content = data.content || "";

    if (!content) {
      return new Response(JSON.stringify({ error: "Conteúdo OFX vazio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extrair ID do banco e conta
    const bankMatch = content.match(/<BANKID>([^<\r\n]+)/i);
    const bankId = bankMatch ? bankMatch[1].trim() : "Bancário";

    // Extrair blocos STMTTRN
    const trnBlocks = content.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|<STMTTRN>|$)/gi) || [];
    let importedCount = 0;

    for (const block of trnBlocks) {
      const dtMatch = block.match(/<DTPOSTED>([^<\r\n]+)/i);
      const amtMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
      const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
      const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);
      const fitidMatch = block.match(/<FITID>([^<\r\n]+)/i);

      if (!amtMatch) continue;

      const rawAmt = amtMatch[1].trim().replace(',', '.');
      const val = parseFloat(rawAmt);
      if (isNaN(val)) continue;

      const isExpense = val < 0;
      const amount = Math.abs(val);
      const desc = memoMatch ? memoMatch[1].trim() : (nameMatch ? nameMatch[1].trim() : "Transação OFX");
      const fitid = fitidMatch ? fitidMatch[1].trim() : "";

      // Data YYYY-MM-DD
      let txDate = new Date().toISOString().slice(0, 10);
      if (dtMatch) {
        const dStr = dtMatch[1].trim().replace(/\[.*\]/, '');
        if (dStr.length >= 8) {
          txDate = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
        }
      }

      await env.DB.prepare(`
        INSERT INTO transactions (description, amount, type, payment_method, date, status, notes, tags)
        VALUES (?, ?, ?, 'Extrato Bancário', ?, 'paid', ?, 'ofx,importado')
      `).bind(
        desc,
        amount,
        isExpense ? 'expense' : 'income',
        txDate,
        `OFX FITID: ${fitid}`
      ).run();

      importedCount++;
    }

    return new Response(JSON.stringify({
      success: true,
      imported_count: importedCount,
      bank_id: bankId
    }), {
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
