import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession, getSessionUser, initialsFrom } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!name || !email || password.length < 6) {
    return NextResponse.json({ error: "Name, email and a 6+ character password are required." }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

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
