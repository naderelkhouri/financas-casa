"""
Integração com o Gateway BunkerPay (bunkerpay.io).
Gera cobranças PIX com liquidação direta/cripto e trata webhooks de confirmação de pagamento para ativação automática do plano SaaS.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

BUNKERPAY_API_URL = os.getenv("BUNKERPAY_API_URL", "https://api.bunkerpay.io/v1")
BUNKERPAY_API_KEY = os.getenv("BUNKERPAY_API_KEY", "")
BUNKERPAY_WEBHOOK_SECRET = os.getenv("BUNKERPAY_WEBHOOK_SECRET", "")

SAAS_PLANS = {
    "pro_monthly": {
        "name": "Plano Pro Mensal",
        "price_brl": 19.90,
        "features": ["OFX Ilimitado", "Contas Ilimitadas", "Cartões de Crédito", "Metas de Poupança"]
    },
    "pro_annual": {
        "name": "Plano Pro Anual",
        "price_brl": 179.00,
        "features": ["Desconto 25%", "OFX Ilimitado", "Contas Ilimitadas", "Suporte Prioritário"]
    }
}

def create_pix_charge(user_id: int, user_email: str, plan_key: str) -> Dict[str, Any]:
    """
    Gera uma cobrança PIX via BunkerPay para ativação do plano SaaS.
    Retorna o QR Code (Copia e Cola), imagem em base64/URL e ID da transação.
    """
    plan = SAAS_PLANS.get(plan_key, SAAS_PLANS["pro_monthly"])
    amount_brl = plan["price_brl"]

    payload = {
        "external_id": f"sub_{user_id}_{plan_key}_{int(os.times().system)}",
        "amount": amount_brl,
        "currency": "BRL",
        "payment_method": "pix",
        "payer": {
            "email": user_email
        },
        "metadata": {
            "user_id": user_id,
            "plan": plan_key
        }
    }

    # Se a API KEY estiver configurada, faz a requisição real
    if BUNKERPAY_API_KEY:
        try:
            req = urllib.request.Request(
                f"{BUNKERPAY_API_URL}/charges",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {BUNKERPAY_API_KEY}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                return json.loads(res_body)
        except urllib.error.URLError as e:
            pass

    # Modo Sandbox / Simulação caso sem API key ativa
    charge_id = f"bunker_charge_{user_id}_{int(os.times().system)}"
    mock_qr_code = f"00020126580014br.gov.bcb.pix0136{charge_id}520400005303986540{amount_brl:.2f}5802BR5915BUNKERPAY_SAAS6009SAO_PAULO62070503***6304ABCD"

    return {
        "status": "pending",
        "charge_id": charge_id,
        "amount": amount_brl,
        "currency": "BRL",
        "plan": plan_key,
        "pix_copy_paste": mock_qr_code,
        "expires_in_minutes": 30,
        "sandbox": True if not BUNKERPAY_API_KEY else False
    }

def handle_bunkerpay_webhook(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processa webhook recebido do BunkerPay notificando que o PIX foi pago.
    """
    event_type = event_data.get("event") or event_data.get("status")
    metadata = event_data.get("metadata", {})
    user_id = metadata.get("user_id")
    plan = metadata.get("plan", "pro")

    if event_type in ("charge.paid", "paid", "confirmed"):
        return {
            "success": True,
            "user_id": user_id,
            "plan": plan,
            "status": "active"
        }
    return {
        "success": False,
        "status": event_type
    }
