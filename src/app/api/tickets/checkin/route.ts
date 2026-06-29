import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { verifyTicket, verifyBattleTicket } from "@/lib/ticket";

/** Mark a booking OR battle entry as checked-in. Vendor/operator only.
    Idempotent — a second scan reports it was already used. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "operator" && !user.staff) return NextResponse.json({ error: "Only venue staff can check tickets in." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");

  // Booking ticket
  const bookingId = verifyTicket(token);
  if (bookingId) {
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!b) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    if (b.status === "cancelled") return NextResponse.json({ error: "This booking was cancelled.", status: "cancelled" }, { status: 409 });
    if (b.checkedInAt) return NextResponse.json({ ok: true, already: true, checkedInAt: b.checkedInAt.getTime() });
    const u = await prisma.booking.update({ where: { id: bookingId }, data: { checkedInAt: new Date() } });
    return NextResponse.json({ ok: true, already: false, checkedInAt: u.checkedInAt!.getTime() });
  }

  // Battle entry
  const bt = verifyBattleTicket(token);
  if (bt) {
    const entry = await prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: bt.tournamentId, userId: bt.userId } } });
    if (!entry) return NextResponse.json({ error: "Not registered for this battle." }, { status: 404 });
    if (entry.checkedInAt) return NextResponse.json({ ok: true, already: true, checkedInAt: entry.checkedInAt.getTime() });
    const u = await prisma.tournamentEntry.update({ where: { id: entry.id }, data: { checkedInAt: new Date() } });
    return NextResponse.json({ ok: true, already: false, checkedInAt: u.checkedInAt!.getTime() });
  }

  return NextResponse.json({ error: "Invalid ticket." }, { status: 400 });
}
