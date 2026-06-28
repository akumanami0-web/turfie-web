import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, initialsFrom } from "@/lib/auth";
import { checkEmailOtp, resendConfigured } from "@/lib/otp";

const isEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

/** Change the account email — requires a verified phone and an email OTP. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.phoneVerified) return NextResponse.json({ error: "Link a verified phone number before changing your email." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  if (!isEmail(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });

  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash && clash.id !== user.id) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });

  // Verify the OTP when email delivery is configured (otherwise allow through
  // so the flow works before Resend keys are added).
  if (resendConfigured()) {
    const ok = await checkEmailOtp(email, code, "change_email");
    if (!ok) return NextResponse.json({ error: "Incorrect or expired code." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { email, initials: user.initials || initialsFrom(user.fullName) } });
  return NextResponse.json({ user: await getSessionUser() });
}
