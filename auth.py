"""
Módulo de Autenticação e Gestão de Usuários (SaaS).
Implementa Hash seguro (PBKDF2-HMAC-SHA256) e tokens de sessão/JWT sem bibliotecas externas pesadas.
"""

import hashlib
import hmac
import os
import json
import base64
import time
from typing import Optional, Dict, Any

SECRET_KEY = os.getenv("SAAS_SECRET_KEY", "bunkerpay-financas-super-secret-key-2026")

def hash_password(password: str) -> str:
    """Gera hash PBKDF2 com salt aleatório de 16 bytes."""
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return salt.hex() + ":" + pw_hash.hex()

def verify_password(stored_password: str, provided_password: str) -> bool:
    """Valida a senha contra o hash armazenado."""
    try:
        salt_hex, hash_hex = stored_password.split(":")
        salt = bytes.fromhex(salt_hex)
        pw_hash = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(pw_hash.hex(), hash_hex)
    except Exception:
        return False

def generate_token(user_id: int, email: str, role: str = "user", plan: str = "free") -> str:
    """Gera token JWT-like assinado (Header.Payload.Signature)."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "plan": plan,
        "exp": int(time.time()) + (86400 * 30)  # 30 dias de validade
    }
    
    b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature_input = f"{b64_header}.{b64_payload}".encode()
    signature = hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
    b64_signature = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{b64_header}.{b64_payload}.{b64_signature}"

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Valida o token e retorna o payload caso seja válido."""
    if not token:
        return None
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        b64_header, b64_payload, b64_signature = parts
        
        # Validar assinatura
        signature_input = f"{b64_header}.{b64_payload}".encode()
        expected_sig = hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
        expected_b64_sig = base64.urlsafe_b64encode(expected_sig).decode().rstrip("=")
        
        if not hmac.compare_digest(b64_signature, expected_b64_sig):
            return None
            
        # Decodificar payload
        padding = "=" * (-len(b64_payload) % 4)
        payload_data = base64.urlsafe_b64decode(b64_payload + padding).decode()
        payload = json.loads(payload_data)
        
        # Checar expiração
        if payload.get("exp", 0) < int(time.time()):
            return None
            
        return payload
    except Exception:
        return None
