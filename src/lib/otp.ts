import "server-only";
import crypto from "crypto";
import { prisma } from "./prisma";

// One-time-password engine.
// • Phone → Twilio Verify when configured (Twilio holds/sends/checks the code).
// • Email → our own 6-digit code delivered via Resend when configured.
// • When a provider isn't configured we fall back to a stored simulated code
//   (logged server-side) so the flow is testable in dev; in that mode the
//   matching enforcement stays OFF so the live site keeps working until keys
//   are added (see twilioConfigured()/resendConfigured()).
const TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
// Fixed code used in demo mode (no SMS/email provider configured) so the flow
// is testable on the live site until real keys are added.
export const DEMO_CODE = "123456";

const genCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");
const hash = (c: string) => crypto.createHash("sha256").update(c).digest("hex");

export function twilioConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
}
export function resendConfigured() {
  return !!process.env.RESEND_API_KEY;
}

async function store(channel: string, target: string, purpose: string, code: string) {
  const expiresAt = new Date(Date.now() + TTL_MIN * 60000);
  await prisma.otp.upsert({
    where: { channel_target_purpose: { channel, target, purpose } },
    update: { codeHash: hash(code), expiresAt, attempts: 0 },
    create: { channel, target, purpose, codeHash: hash(code), expiresAt },
  });
}

async function checkStored(channel: string, target: string, purpose: string, code: string): Promise<boolean> {
  const row = await prisma.otp.findUnique({ where: { channel_target_purpose: { channel, target, purpose } } });
  if (!row || row.expiresAt < new Date() || row.attempts >= MAX_ATTEMPTS) return false;
  if (row.codeHash !== hash(code)) {
    await prisma.otp.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await prisma.otp.delete({ where: { id: row.id } }).catch(() => {});
  return true;
}

/* ── Phone (Twilio Verify) ── */
export async function startPhoneOtp(phone: string, channel: "sms" | "whatsapp"): Promise<{ simulated: boolean }> {
  if (twilioConfigured()) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID!, token = process.env.TWILIO_AUTH_TOKEN!, svc = process.env.TWILIO_VERIFY_SERVICE_SID!;
      const res = await fetch(`https://verify.twilio.com/v2/Services/${svc}/Verifications`, {
        method: "POST",
        headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: phone, Channel: channel }),
      });
      if (!res.ok) throw new Error("twilio start failed: " + (await res.text()));
      return { simulated: false };
    } catch (e) {
      // Twilio configured but couldn't actually send (e.g. no credits / trial /
      // unverified number) → fall back to the demo code so the flow still works.
      console.warn("twilio send failed, falling back to demo code:", e instanceof Error ? e.message : e);
      await store("phone", phone, "verify", DEMO_CODE);
      return { simulated: true };
    }
  }
  await store("phone", phone, "verify", DEMO_CODE);
  console.log(`[otp] demo phone code for ${phone}: ${DEMO_CODE}`);
  return { simulated: true };
}

export async function checkPhoneOtp(phone: string, code: string): Promise<boolean> {
  // A demo/fallback code stored for this number always wins (covers the case
  // where Twilio send failed and we fell back).
  if (await checkStored("phone", phone, "verify", code)) return true;
  if (twilioConfigured()) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID!, token = process.env.TWILIO_AUTH_TOKEN!, svc = process.env.TWILIO_VERIFY_SERVICE_SID!;
      const res = await fetch(`https://verify.twilio.com/v2/Services/${svc}/VerificationCheck`, {
        method: "POST",
        headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: phone, Code: code }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === "approved";
    } catch {
      return false;
    }
  }
  return false;
}

/* ── Email (Resend) ── */
export async function startEmailOtp(email: string, purpose: string): Promise<{ simulated: boolean }> {
  const code = resendConfigured() ? genCode() : DEMO_CODE;
  await store("email", email, purpose, code);
  if (resendConfigured()) {
    const html = `<div style="font-family:system-ui,sans-serif;padding:24px"><h2 style="margin:0 0 8px">Verify your email</h2><p style="color:#555;margin:0 0 16px">Use this code to continue on Turfie. It expires in ${TTL_MIN} minutes.</p><div style="font-size:32px;font-weight:800;letter-spacing:6px;background:#e2f6d5;color:#163300;border-radius:12px;padding:16px;text-align:center">${code}</div></div>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.RESEND_FROM || "Turfie <onboarding@resend.dev>", to: email, subject: "Your Turfie verification code", html }),
    }).catch(() => {});
    return { simulated: false };
  }
  console.log(`[otp] demo email code for ${email}: ${code}`);
  return { simulated: true };
}

export async function checkEmailOtp(email: string, code: string, purpose: string): Promise<boolean> {
  return checkStored("email", email, purpose, code);
}

/** E.164-ish normalisation; defaults to India (+91) when no country code. */
export function normalisePhone(raw: string): string | null {
  const t = raw.trim().replace(/[\s-()]/g, "");
  if (/^\+\d{8,15}$/.test(t)) return t;
  const digits = t.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return "+" + digits;
  return null;
}
