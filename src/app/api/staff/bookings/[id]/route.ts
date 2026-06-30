import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { rowToBooking } from "@/lib/bookings";
import { getTurf } from "@/lib/turfs";
import { slotRange, fmtDateShort } from "@/lib/format";

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
      dateKey: b.dateKey,
      startHour: b.startHour,
      durationHrs: b.durationHrs,
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
  const action = String(b.action || "");

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (action === "cancel") {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "cancelled", cancelledAt: new Date(), refundMethod: "Turfie wallet", refundPct: 100, refundAmount: existing.price },
    });
    return NextResponse.json({ booking: rowToBooking(updated) });
  }

  // Staff override reschedule — no fee, no quota; admins can move any booking.
  if (action === "reschedule") {
    const dateKey = b.dateKey ? String(b.dateKey) : existing.dateKey;
    const startHour = b.startHour != null ? Number(b.startHour) : existing.startHour;
    const durationHrs = b.durationHrs != null ? Math.max(1, Number(b.durationHrs)) : existing.durationHrs;
    if (!dateKey || startHour == null) return NextResponse.json({ error: "Pick a date and start time." }, { status: 400 });
    if (startHour < 0 || startHour > 23) return NextResponse.json({ error: "Start time is out of range." }, { status: 400 });

    const kickoffAt = new Date(`${dateKey}T00:00:00`);
    kickoffAt.setHours(kickoffAt.getHours() + Number(startHour));
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        dateKey,
        dateLabel: fmtDateShort(new Date(`${dateKey}T00:00:00`)),
        startHour: Number(startHour),
        durationHrs,
        duration: `${durationHrs} hr`,
        time: slotRange(startHour, durationHrs) || existing.time,
        kickoffAt,
        // a moved booking that was already played/cancelled becomes upcoming again
        status: existing.status === "cancelled" ? existing.status : "upcoming",
      },
    });
    return NextResponse.json({ booking: rowToBooking(updated) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
