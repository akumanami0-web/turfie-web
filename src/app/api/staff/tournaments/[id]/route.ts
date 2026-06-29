import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (b.status && ["upcoming", "live", "completed"].includes(b.status)) data.status = b.status;
  if (b.title != null) data.title = String(b.title);
  if (b.dateLabel != null) data.dateLabel = String(b.dateLabel);
  if (b.time != null) data.time = String(b.time);
  if (b.prizePool != null) data.prizePool = String(b.prizePool);
  if (b.slots != null) data.slots = Math.max(2, Number(b.slots) || 16);

  const t = await prisma.tournament.update({ where: { id }, data });
  return NextResponse.json({ tournament: t });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
  await prisma.tournamentEntry.deleteMany({ where: { tournamentId: id } });
  await prisma.tournament.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
