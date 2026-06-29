import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Staff: change a user's role and/or assign a turf to them (vendor onboarding). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (b.role && ["player", "operator", "staff"].includes(b.role)) {
    await prisma.user.update({ where: { id }, data: { role: b.role } });
  }
  if (b.assignTurfId) {
    await prisma.turf.update({ where: { id: String(b.assignTurfId) }, data: { ownerId: id } });
  }
  if (b.unassignTurfId) {
    await prisma.turf.updateMany({ where: { id: String(b.unassignTurfId), ownerId: id }, data: { ownerId: null } });
  }
  return NextResponse.json({ ok: true });
}
