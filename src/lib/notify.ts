import "server-only";

// Best-effort outbound notifications. Email via Resend, WhatsApp via Twilio.
// When a provider isn't configured we simply skip it (the caller still gets the
// link back to share manually), so nothing breaks without credits/keys.

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || "Turfie <onboarding@resend.dev>", to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendWhatsApp(toPhone: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"
  if (!sid || !token || !from || !toPhone) return false;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: from, To: `whatsapp:${toPhone}`, Body: body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
