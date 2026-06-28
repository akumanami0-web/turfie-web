import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { startEmailOtp } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const isEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const purpose = body.purpose === "change_email" ? "change_email" : "signup";
  if (!isEmail(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  if (!(await rateLimit(`otp:email:${clientIp(req)}:${email}`, 5, 600))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  if (purpose === "change_email") {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.phoneVerified) return NextResponse.json({ error: "Link a verified phone number before changing your email." }, { status: 403 });
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== user.id) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  } else {
    // signup: don't reveal existence, but don't send to an existing account
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  try {
    const { simulated } = await startEmailOtp(email, purpose);
    return NextResponse.json({ ok: true, simulated });
  } catch {
    return NextResponse.json({ error: "Couldn't send the code. Please try again." }, { status: 502 });
  }
}
