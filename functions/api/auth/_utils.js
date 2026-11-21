// Funções utilitárias de Criptografia e JWT para Cloudflare Workers / Edge Runtime
// Utiliza a Web Crypto API nativa (subtle crypto) disponível na Cloudflare

const JWT_SECRET_DEFAULT = "cf-financas-pessoais-admx-jwt-super-secret-key-2026-edge";

// Gera hash de senha seguro usando PBKDF2 com SHA-256 e Salt de 16 bytes
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

// Valida senha contra hash PBKDF2 em tempo constante (proteção contra timing attacks)
export async function verifyPassword(storedHash, providedPassword) {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;

    const [saltHex, expectedHashHex] = parts;
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(providedPassword),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    const derivedHashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Comparação em tempo constante
    if (derivedHashHex.length !== expectedHashHex.length) return false;
    let match = 0;
    for (let i = 0; i < derivedHashHex.length; i++) {
      match |= derivedHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return match === 0;
  } catch (err) {
    return false;
  }
}

// Gera JWT assinado com HMAC-SHA256
export async function createJWT(payload, secret = JWT_SECRET_DEFAULT) {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  
  const tokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (86400 * 7), // 7 dias de validade
    iat: Math.floor(Date.now() / 1000)
  };

  const b64Header = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const b64Payload = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = encoder.encode(`${b64Header}.${b64Payload}`);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const b64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${b64Header}.${b64Payload}.${b64Signature}`;
}

// Valida assinatura e expiração do JWT
export async function verifyJWT(token, secret = JWT_SECRET_DEFAULT) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [b64Header, b64Payload, b64Signature] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${b64Header}.${b64Payload}`);

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decodificar assinatura base64url
    let base64 = b64Signature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const sigBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!isValid) return null;

    // Decodificar payload
    let payloadStr = b64Payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) payloadStr += '=';
    const payload = JSON.parse(atob(payloadStr));

    // Validar expiração
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

// Extrai usuário autenticado via Cookie seguro ou Header Authorization
export async function authenticateRequest(request, secret = JWT_SECRET_DEFAULT) {
  // 1. Tenta pegar do Cookie HttpOnly 'auth_token'
  const cookieHeader = request.headers.get("Cookie") || "";
  let token = null;

  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (match) {
    token = match[1];
  }

  // 2. Fallback para Header Authorization Bearer
  if (!token) {
    const authHeader = request.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;
  return await verifyJWT(token, secret);
}
