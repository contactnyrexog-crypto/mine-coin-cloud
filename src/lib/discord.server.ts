export async function sendPaymentWebhook(payload: {
  orderId: string;
  paymentType: string;
  planLabel: string;
  productType: string;
  amount: string;
  paidAt: string;
  proofUrl: string | null;
  buyerEmail: string;
  adminUrl: string;
}) {
  const url = process.env["DISCORD_WEBHOOK_URL"];
  if (!url) return;

  const body = {
    username: "NETHOST Payments",
    embeds: [
      {
        title: "🧾 New Payment Submitted",
        color: 0x9b5cff,
        fields: [
          { name: "Payment Type", value: payload.paymentType, inline: true },
          { name: "Product", value: payload.productType.toUpperCase(), inline: true },
          {
            name: payload.productType === "vps" ? "VPS Plan" : "Minecraft Plan",
            value: payload.planLabel,
            inline: false,
          },
          { name: "Amount", value: payload.amount, inline: true },
          { name: "Buyer", value: payload.buyerEmail, inline: true },
          { name: "Paid At", value: payload.paidAt, inline: false },
          {
            name: "Payment Proof",
            value: payload.proofUrl ? `[Open screenshot](${payload.proofUrl})` : "Not uploaded",
          },
          {
            name: "Actions",
            value: `[✅ Accept](${payload.adminUrl}?order=${payload.orderId}&action=accept) • [❌ Reject](${payload.adminUrl}?order=${payload.orderId}&action=reject)`,
          },
        ],
        image: payload.proofUrl ? { url: payload.proofUrl } : undefined,
        footer: { text: `Order ${payload.orderId}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("Discord webhook failed", res.status, await res.text());
}
