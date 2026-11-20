"""
Parser Nativo de Extratos Bancários OFX (Open Financial Exchange).
Lê extratos padrão de bancos brasileiros (Nubank, Itaú, Santander, Inter, Bradesco, etc.)
sem necessitar de bibliotecas C pesadas.
"""

import re
import datetime
from typing import List, Dict, Any, Optional

def parse_ofx_date(date_str: str) -> str:
    """Converte datas OFX (ex: 20261115120000[-03:EST] ou 20261115) para YYYY-MM-DD."""
    if not date_str:
        return datetime.date.today().strftime("%Y-%m-%d")
    clean = re.sub(r'\[.*\]', '', date_str.strip())
    if len(clean) >= 8:
        year = clean[:4]
        month = clean[4:6]
        day = clean[6:8]
        return f"{year}-{month}-{day}"
    return datetime.date.today().strftime("%Y-%m-%d")

def parse_ofx_content(content: str) -> Dict[str, Any]:
    """
    Analisa o conteúdo de um arquivo .OFX (SGML ou XML) e extrai metadados da conta e transações.
    """
    result = {
        "bank_id": "",
        "account_id": "",
        "account_type": "checking",
        "transactions": []
    }

    # Extrair metadados da conta
    bank_match = re.search(r'<BANKID>([^<\r\n]+)', content, re.IGNORECASE)
    if bank_match:
        result["bank_id"] = bank_match.group(1).strip()

    acct_match = re.search(r'<ACCTID>([^<\r\n]+)', content, re.IGNORECASE)
    if acct_match:
        result["account_id"] = acct_match.group(1).strip()

    # Procurar blocos STMTTRN (transações)
    # Suporta tanto tags fechadas </STMTTRN> quanto SGML aberto
    trn_blocks = re.findall(r'<STMTTRN>.*?(?=(?:</STMTTRN>|<STMTTRN>|\Z))', content, re.IGNORECASE | re.DOTALL)
    
    for block in trn_blocks:
        trntype_m = re.search(r'<TRNTYPE>([^<\r\n]+)', block, re.IGNORECASE)
        dtposted_m = re.search(r'<DTPOSTED>([^<\r\n]+)', block, re.IGNORECASE)
        trnamt_m = re.search(r'<TRNAMT>([^<\r\n]+)', block, re.IGNORECASE)
        fitid_m = re.search(r'<FITID>([^<\r\n]+)', block, re.IGNORECASE)
        memo_m = re.search(r'<MEMO>([^<\r\n]+)', block, re.IGNORECASE)
        name_m = re.search(r'<NAME>([^<\r\n]+)', block, re.IGNORECASE)

        trntype = trntype_m.group(1).strip().upper() if trntype_m else "OTHER"
        dtposted = dtposted_m.group(1).strip() if dtposted_m else ""
        raw_amt = trnamt_m.group(1).strip() if trnamt_m else "0"
        fitid = fitid_m.group(1).strip() if fitid_m else ""
        memo = memo_m.group(1).strip() if memo_m else ""
        name = name_m.group(1).strip() if name_m else ""

        # Descrição canônica
        description = memo or name or "Transação Bancária"
        
        # Limpar valor
        try:
            val = float(raw_amt.replace(',', '.'))
        except ValueError:
            val = 0.0

        # Determinar tipo: receita ou despesa
        # No OFX: valores negativos são débitos/despesas, positivos são créditos/receitas
        if val < 0:
            tx_type = "expense"
            abs_amount = round(abs(val), 2)
        else:
            tx_type = "income"
            abs_amount = round(val, 2)

        formatted_date = parse_ofx_date(dtposted)

        result["transactions"].append({
            "fitid": fitid,
            "description": description,
            "amount": abs_amount,
            "type": tx_type,
            "date": formatted_date,
            "raw_type": trntype
        })

    return result
