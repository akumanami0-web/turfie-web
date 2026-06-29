import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { rowToBooking } from "@/lib/bookings";
import { getTurf } from "@/lib/turfs";
import { slotRange } from "@/lib/format";

/** Staff: full booking detail for the popup. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const b = await prisma.booking.findUnique({ where: { id }, include: { user: true } });
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const turf = await getTurf(b.turfId);

  return NextResponse.json({
    booking: {
      id: b.id,
      name: b.user?.fullName || b.contactName || "Guest",
      email: b.user?.email || b.contactEmail || "—",
      phone: b.user?.phone || b.contactPhone || "—",
      initials: b.user?.initials || "GU",
      photoUrl: b.user?.photoUrl || null,
      turf: turf?.name || b.turfId,
      area: turf?.area || "",
      unit: b.unit, field: b.field,
      dateLabel: b.dateLabel,
      time: slotRange(b.startHour, b.durationHrs) || b.time,
      duration: b.duration,
      players: b.players,
      price: b.price,
      status: b.status,
      checkedIn: !!b.checkedInAt,
    },
  });
}

/** Staff: cancel any booking (support action) with a full wallet refund. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (b.action !== "cancel") return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "cancelled", cancelledAt: new Date(), refundMethod: "Turfie wallet", refundPct: 100, refundAmount: existing.price },
  });
  return NextResponse.json({ booking: rowToBooking(updated) });
}
