import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTurf } from "@/lib/turfs";
import { verifyTicket, verifyBattleTicket } from "@/lib/ticket";
import { slotRange } from "@/lib/format";

/** Validate a scanned QR (booking ticket OR battle entry) and return a
    normalised summary the scanner can render. The signed token is the proof,
    so no login is required to read it. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");

  // 1) Booking ticket?
  const bookingId = verifyTicket(token);
  if (bookingId) {
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!b) return NextResponse.json({ ok: false, error: "Ticket not found." }, { status: 404 });
    const turf = await getTurf(b.turfId);
    return NextResponse.json({
      ok: true,
      booking: {
        kind: "booking", id: b.id, turfName: turf?.name || "Turf", area: turf?.area || "", sport: b.sport,
        unit: b.unit, field: b.field, dateLabel: b.dateLabel, time: slotRange(b.startHour, b.durationHrs) || b.time,
        duration: b.duration, status: b.status, checkedInAt: b.checkedInAt ? b.checkedInAt.getTime() : null, name: b.contactName,
      },
    });
  }

  // 2) Battle entry?
  const bt = verifyBattleTicket(token);
  if (bt) {
    const [t, entry, user] = await Promise.all([
      prisma.tournament.findUnique({ where: { id: bt.tournamentId } }),
      prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: bt.tournamentId, userId: bt.userId } } }),
      prisma.user.findUnique({ where: { id: bt.userId } }),
    ]);
    if (!t || !entry) return NextResponse.json({ ok: false, error: "Not registered for this battle." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      booking: {
        kind: "battle", id: t.id, turfName: t.title, area: t.area || t.address || "", sport: t.sport,
        unit: "Format", field: t.format, dateLabel: t.dateLabel, time: t.time,
        duration: "", status: t.status, checkedInAt: entry.checkedInAt ? entry.checkedInAt.getTime() : null, name: user?.fullName || null,
      },
    });
  }

  return NextResponse.json({ ok: false, error: "Invalid ticket." }, { status: 400 });
}
