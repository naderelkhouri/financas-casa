export async function onRequestPost() {
  const cookieFlags = [
    "auth_token=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ].join("; ");

  return new Response(JSON.stringify({ success: true, message: "Sessão encerrada com sucesso." }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieFlags
    }
  });
}
