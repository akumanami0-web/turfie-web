import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession, getSessionUser, initialsFrom } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkEmailOtp, resendConfigured } from "@/lib/otp";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const code = String(body.code || "").trim();
  if (!name || !email || password.length < 6) {
    return NextResponse.json({ error: "Name, email and a 6+ character password are required." }, { status: 400 });
  }
  // Throttle signup abuse: 6 new accounts / hour per IP.
  if (!(await rateLimit(`register:${clientIp(req)}`, 6, 3600))) {
    return NextResponse.json({ error: "Too many sign-ups from this network. Please try again later." }, { status: 429 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  // Require a verified email code when email delivery is configured.
  if (resendConfigured() && !(await checkEmailOtp(email, code, "signup"))) {
    return NextResponse.json({ error: "Please verify your email with the code we sent.", needsCode: true }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: name.split(/\s+/)[0],
      fullName: name,
      initials: initialsFrom(name),
      passwordHash: await hashPassword(password),
    },
  });
  await setSession(user.id);
  return NextResponse.json({ user: await getSessionUser() });
}
