export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const data = await request.json();
    const plan = data.plan || "pro_monthly";
    const amount = plan === "pro_annual" ? 179.00 : 19.90;

    const chargeId = `bunker_cf_${Date.now()}`;
    const pixCopyPaste = `00020126580014br.gov.bcb.pix0136${chargeId}520400005303986540${amount.toFixed(2)}5802BR5915BUNKERPAY_SAAS6009SAO_PAULO62070503***6304ABCD`;

    return new Response(JSON.stringify({
      status: "pending",
      charge_id: chargeId,
      amount: amount,
      currency: "BRL",
      plan: plan,
      pix_copy_paste: pixCopyPaste,
      expires_in_minutes: 30,
      sandbox: true
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
