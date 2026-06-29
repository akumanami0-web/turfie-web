import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getTurfs } from "@/lib/turfs";
import { slotRange } from "@/lib/format";

/** Staff: full details for one player (profile + booking history). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [rows, turfs] = await Promise.all([
    prisma.booking.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    getTurfs(),
  ]);
  const turfName = new Map(turfs.map((t) => [t.id, t.name]));
  const bookings = rows.map((b) => ({
    id: b.id, turf: turfName.get(b.turfId) || b.turfId,
    when: `${b.dateLabel} · ${slotRange(b.startHour, b.durationHrs) || b.time}`,
    status: b.status, price: b.price,
  }));

  return NextResponse.json({
    user: {
      id: u.id, name: u.fullName, email: u.email, phone: u.phone, phoneVerified: u.phoneVerified,
      role: u.role, city: u.city, level: u.level, gender: u.gender, birthday: u.birthday,
      initials: u.initials, photoUrl: u.photoUrl, suspended: u.suspended,
      joined: new Date(u.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    },
    bookings,
  });
}

/** Staff: change a user's role and/or assign a turf to them (vendor onboarding). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (b.role && ["player", "operator", "staff"].includes(b.role)) {
    await prisma.user.update({ where: { id }, data: { role: b.role } });
  }
  if (typeof b.suspended === "boolean") {
    await prisma.user.update({ where: { id }, data: { suspended: b.suspended } });
  }
  if (b.assignTurfId) {
    await prisma.turf.update({ where: { id: String(b.assignTurfId) }, data: { ownerId: id } });
  }
  if (b.unassignTurfId) {
    await prisma.turf.updateMany({ where: { id: String(b.unassignTurfId), ownerId: id }, data: { ownerId: null } });
  }
  return NextResponse.json({ ok: true });
}

/** Staff: permanently delete a user. Bookings are kept (anonymised) for records. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
  if (id === staff.id) return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });

  await prisma.tournamentEntry.deleteMany({ where: { userId: id } });
  await prisma.favourite.deleteMany({ where: { userId: id } });
  await prisma.turf.updateMany({ where: { ownerId: id }, data: { ownerId: null } });
  await prisma.booking.updateMany({ where: { userId: id }, data: { userId: null } }); // keep records, drop the link
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
