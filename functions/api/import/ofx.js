import { authenticateRequest } from "../auth/_utils.js";

// Mapeamento heurístico de termos frequentes para categorias
const KEYWORD_RULES = [
  { match: /mercado|supermercado|carrefour|extra|pao de acucar|assai|atacad|hortifruti|acougue/i, name: 'Alimentação & Mercado' },
  { match: /ifood|ubereats|rappi|restaurante|burger|mcdonald|subway|pizza|bar |lanche/i, name: 'Lazer & Restaurantes' },
  { match: /posto|gasolina|combust|shell|ipiranga|br distribuidora|uber\*|99app|estapar|sem parar|estacionamento/i, name: 'Transporte & Combustível' },
  { match: /farmacia|droga|drogaria|panvel|pacheco|raia|medic|hospital|laborat|consulta/i, name: 'Saúde & Farmácia' },
  { match: /netflix|spotify|amazon prime|disney|hbo|apple\.com|youtube|globo|openai|chatgpt/i, name: 'Assinaturas & Streaming' },
  { match: /enel|sabesp|cemig|copel|light|cpfl|energia|vivo|claro|tim|oi|internet|condominio/i, name: 'Contas (Água, Luz, Internet)' },
  { match: /aluguel|imobiliaria|quintoandar|iptu/i, name: 'Moradia' },
  { match: /mercado livre|amazon|shopee|shein|magalu|aliexpress|zara|renner|riachuelo/i, name: 'Vestuário & Compras' },
  { match: /salario|pro labore|remuneracao|pagamento recebido/i, name: 'Salário' },
  { match: /rendimento|dividendos|juros|tesouro|cdi|selic|invest/i, name: 'Rendimentos & Investimentos' }
];

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Banco Cloudflare D1 não vinculado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const secret = env.JWT_SECRET || "financas-secret-dev-key-2026";
  const authUser = await authenticateRequest(request, secret);
  const userId = authUser ? authUser.user_id : 1;

  try {
    const data = await request.json();
    const content = data.content || "";

    if (!content) {
      return new Response(JSON.stringify({ error: "Conteúdo do extrato está vazio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Carregar mapa de categorias do banco
    const catQuery = await env.DB.prepare("SELECT id, name, type FROM categories").all();
    const catList = catQuery.results || [];
    const catByName = {};
    catList.forEach(c => { catByName[c.name] = c.id; });

    // Extrair ID do banco e conta
    const bankMatch = content.match(/<BANKID>([^<\r\n]+)/i);
    const bankId = bankMatch ? bankMatch[1].trim() : "Extrato Bancário";

    // Extrair blocos STMTTRN
    const trnBlocks = content.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|<STMTTRN>|$)/gi) || [];
    let importedCount = 0;
    let autoCategorizedCount = 0;

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

      // Deduplicação por FITID / Notas
      if (fitid) {
        const existing = await env.DB.prepare(
          "SELECT id FROM transactions WHERE user_id = ? AND notes LIKE ?"
        ).bind(userId, `%FITID: ${fitid}%`).first();
        if (existing) continue; // Evita duplicação ao reimportar o mesmo extrato
      }

      // Classificação Heurística Inteligente
      let assignedCategoryId = null;
      for (const rule of KEYWORD_RULES) {
        if (rule.match.test(desc)) {
          if (catByName[rule.name]) {
            assignedCategoryId = catByName[rule.name];
            autoCategorizedCount++;
            break;
          }
        }
      }

      // Fallback para categoria padrão caso não bata com nenhuma regra
      if (!assignedCategoryId) {
        assignedCategoryId = isExpense ? catByName['Outras Despesas'] : catByName['Rendimentos & Investimentos'];
      }

      // Formatar Data YYYY-MM-DD
      let txDate = new Date().toISOString().slice(0, 10);
      if (dtMatch) {
        const dStr = dtMatch[1].trim().replace(/\[.*\]/, '');
        if (dStr.length >= 8) {
          txDate = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
        }
      }

      await env.DB.prepare(`
        INSERT INTO transactions (user_id, description, amount, type, category_id, payment_method, date, status, notes, tags)
        VALUES (?, ?, ?, ?, ?, 'Extrato Bancário', ?, 'paid', ?, 'ofx,importado')
      `).bind(
        userId,
        desc,
        amount,
        isExpense ? 'expense' : 'income',
        assignedCategoryId || null,
        txDate,
        `OFX FITID: ${fitid}`
      ).run();

      importedCount++;
    }

    return new Response(JSON.stringify({
      success: true,
      imported_count: importedCount,
      auto_categorized: autoCategorizedCount,
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
