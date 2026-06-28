import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { checkPhoneOtp, normalisePhone } from "@/lib/otp";

/** Verify the OTP and permanently link the phone to the account. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.phoneVerified) return NextResponse.json({ error: "Your phone is already linked." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const phone = normalisePhone(String(body.phone || ""));
  const code = String(body.code || "").trim();
  if (!phone || !code) return NextResponse.json({ error: "Enter the code we sent you." }, { status: 400 });

  // one verified phone per account
  const taken = await prisma.user.findFirst({ where: { phone, phoneVerified: true, NOT: { id: user.id } } });
  if (taken) return NextResponse.json({ error: "That phone number is already linked to another account." }, { status: 409 });

  const ok = await checkPhoneOtp(phone, code);
  if (!ok) return NextResponse.json({ error: "Incorrect or expired code." }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { phone, phoneVerified: true } });
  return NextResponse.json({ user: await getSessionUser() });
}
