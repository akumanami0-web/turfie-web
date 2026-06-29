import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Join a tournament (free entry for now). Idempotent + capacity-checked. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to join a battle." }, { status: 401 });

  const t = await prisma.tournament.findUnique({ where: { id }, include: { _count: { select: { entries: true } } } });
  if (!t) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  if (t.status === "completed") return NextResponse.json({ error: "This tournament has ended." }, { status: 409 });

  const existing = await prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: id, userId: user.id } } });
  if (existing) return NextResponse.json({ ok: true, joined: true });

  if (t._count.entries >= t.slots) return NextResponse.json({ error: "This tournament is full." }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  await prisma.tournamentEntry.create({ data: { tournamentId: id, userId: user.id, teamName: body.teamName ? String(body.teamName) : null } });
  return NextResponse.json({ ok: true, joined: true });
}

/** Leave a tournament. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.tournamentEntry.deleteMany({ where: { tournamentId: id, userId: user.id } });
  return NextResponse.json({ ok: true, joined: false });
}
