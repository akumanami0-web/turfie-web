import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** List the signed-in user's favourite turf ids (empty for guests). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ids: [] });
  const rows = await prisma.favourite.findMany({ where: { userId: user.id }, select: { turfId: true } });
  return NextResponse.json({ ids: rows.map((r) => r.turfId) });
}

/** Toggle a favourite for the signed-in user; returns the updated id list. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to save turfs" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const turfId = String(body.turfId || "");
  if (!turfId) return NextResponse.json({ error: "turfId required" }, { status: 400 });

  const existing = await prisma.favourite.findUnique({ where: { userId_turfId: { userId: user.id, turfId } } });
  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favourite.create({ data: { userId: user.id, turfId } });
  }
  const rows = await prisma.favourite.findMany({ where: { userId: user.id }, select: { turfId: true } });
  return NextResponse.json({ ids: rows.map((r) => r.turfId), saved: !existing });
}
