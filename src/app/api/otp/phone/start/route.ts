import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { startPhoneOtp, normalisePhone } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.phoneVerified) return NextResponse.json({ error: "Your phone is already linked." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const phone = normalisePhone(String(body.phone || ""));
  const channel = body.channel === "whatsapp" ? "whatsapp" : "sms";
  if (!phone) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });

  // throttle: 5 sends / 10 min per user+phone
  if (!(await rateLimit(`otp:phone:${user.id}:${phone}`, 5, 600))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }
  // and a coarser per-IP cap
  if (!(await rateLimit(`otp:phone:ip:${clientIp(req)}`, 20, 3600))) {
    return NextResponse.json({ error: "Too many attempts. Please try later." }, { status: 429 });
  }

  try {
    const { simulated } = await startPhoneOtp(phone, channel);
    return NextResponse.json({ ok: true, phone, simulated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.error("phone otp start failed:", msg);
    // Surface a hint (e.g. Twilio trial only allows verified numbers) without leaking secrets.
    const hint = /unverified|trial|not a valid|60200|21608/i.test(msg)
      ? "Your SMS provider rejected this number (trial accounts can only message verified numbers)."
      : "Couldn't send the code. Check the SMS provider setup and try again.";
    return NextResponse.json({ error: hint }, { status: 502 });
  }
}
