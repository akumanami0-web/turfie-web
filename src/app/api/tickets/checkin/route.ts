import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getTurf } from "@/lib/turfs";
import { verifyTicket, verifyBattleTicket } from "@/lib/ticket";
import { bookingWindow, battleWindow, windowState } from "@/lib/checkin";

/** Mark a booking OR battle entry as checked-in. Vendor/operator or staff only.
    An operator may only check in passes for a venue they manage, and only
    inside the check-in window (≤30 min before start, never after it ends).
    Idempotent — a second scan reports it was already used. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isStaff = !!user.staff;
  if (user.role !== "operator" && !isStaff) return NextResponse.json({ error: "Only venue staff can check tickets in." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");

  // Booking ticket
  const bookingId = verifyTicket(token);
  if (bookingId) {
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!b) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    if (b.status === "cancelled") return NextResponse.json({ error: "This booking was cancelled.", status: "cancelled" }, { status: 409 });
    const turf = await getTurf(b.turfId);
    if (!isStaff && turf?.ownerId !== user.id) {
      return NextResponse.json({ error: `This pass is for ${turf?.name || "another venue"} — only that venue can scan it in.` }, { status: 403 });
    }
    if (b.checkedInAt) return NextResponse.json({ ok: true, already: true, checkedInAt: b.checkedInAt.getTime() });
    const elig = windowState(Date.now(), bookingWindow(b.dateKey, b.startHour, b.durationHrs));
    if (!elig.eligible) return NextResponse.json({ error: elig.reason || "Check-in isn't open right now." }, { status: 409 });
    const u = await prisma.booking.update({ where: { id: bookingId }, data: { checkedInAt: new Date() } });
    return NextResponse.json({ ok: true, already: false, checkedInAt: u.checkedInAt!.getTime() });
  }

  // Battle entry
  const bt = verifyBattleTicket(token);
  if (bt) {
    const [t, entry] = await Promise.all([
      prisma.tournament.findUnique({ where: { id: bt.tournamentId } }),
      prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: bt.tournamentId, userId: bt.userId } } }),
    ]);
    if (!t || !entry) return NextResponse.json({ error: "Not registered for this battle." }, { status: 404 });
    if (!isStaff) {
      const turf = t.turfId ? await getTurf(t.turfId) : null;
      if (!turf || turf.ownerId !== user.id) {
        return NextResponse.json({ error: `This battle pass isn't for your venue — only ${turf?.name || "the host venue"} can scan it in.` }, { status: 403 });
      }
    }
    if (entry.checkedInAt) return NextResponse.json({ ok: true, already: true, checkedInAt: entry.checkedInAt.getTime() });
    const elig = windowState(Date.now(), battleWindow(t.startAt));
    if (!elig.eligible) return NextResponse.json({ error: elig.reason || "Check-in isn't open right now." }, { status: 409 });
    const u = await prisma.tournamentEntry.update({ where: { id: entry.id }, data: { checkedInAt: new Date() } });
    return NextResponse.json({ ok: true, already: false, checkedInAt: u.checkedInAt!.getTime() });
  }

  return NextResponse.json({ error: "Invalid ticket." }, { status: 400 });
}
