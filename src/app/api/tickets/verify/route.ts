import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getTurf } from "@/lib/turfs";
import { verifyTicket, verifyBattleTicket } from "@/lib/ticket";
import { slotRange } from "@/lib/format";
import { bookingWindow, battleWindow, windowState } from "@/lib/checkin";

/** Validate a scanned QR (booking ticket OR battle entry) and return a
    normalised summary the scanner can render. The signed token is the proof,
    so no login is required to read it — but an operator may only scan passes
    for a venue they are assigned to. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");

  const viewer = await getSessionUser();
  const isStaff = !!viewer?.staff;
  const isOperator = viewer?.role === "operator";

  // 1) Booking ticket?
  const bookingId = verifyTicket(token);
  if (bookingId) {
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!b) return NextResponse.json({ ok: false, error: "Ticket not found." }, { status: 404 });
    const turf = await getTurf(b.turfId);
    // Venue gate: an operator can only scan passes for their own turf.
    if (isOperator && !isStaff && turf?.ownerId !== viewer!.id) {
      return NextResponse.json({ ok: false, error: `This pass is for ${turf?.name || "another venue"} — only that venue can scan it in.` }, { status: 403 });
    }
    const w = bookingWindow(b.kickoffAt, b.durationHrs);
    const elig = windowState(Date.now(), w);
    return NextResponse.json({
      ok: true,
      booking: {
        kind: "booking", id: b.id, turfName: turf?.name || "Turf", area: turf?.area || "", sport: b.sport,
        unit: b.unit, field: b.field, dateLabel: b.dateLabel, time: slotRange(b.startHour, b.durationHrs) || b.time,
        duration: b.duration, status: b.status, checkedInAt: b.checkedInAt ? b.checkedInAt.getTime() : null, name: b.contactName,
        eligible: elig.eligible, reason: elig.reason,
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
    // Venue gate for battles hosted at a listed turf.
    if (isOperator && !isStaff) {
      const turf = t.turfId ? await getTurf(t.turfId) : null;
      if (!turf || turf.ownerId !== viewer!.id) {
        return NextResponse.json({ ok: false, error: `This battle pass isn't for your venue — only ${turf?.name || "the host venue"} can scan it in.` }, { status: 403 });
      }
    }
    const w = battleWindow(t.startAt);
    const elig = windowState(Date.now(), w);
    return NextResponse.json({
      ok: true,
      booking: {
        kind: "battle", id: t.id, turfName: t.title, area: t.area || t.address || "", sport: t.sport,
        unit: "Format", field: t.format, dateLabel: t.dateLabel, time: t.time,
        duration: "", status: t.status, checkedInAt: entry.checkedInAt ? entry.checkedInAt.getTime() : null, name: user?.fullName || null,
        eligible: elig.eligible, reason: elig.reason,
      },
    });
  }

  return NextResponse.json({ ok: false, error: "Invalid ticket." }, { status: 400 });
}
