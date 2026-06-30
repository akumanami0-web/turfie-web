import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { rowToBooking } from "@/lib/bookings";
import { getTurf } from "@/lib/turfs";
import { slotRange, fmtDateShort } from "@/lib/format";
import { istDate, slotIsPast } from "@/lib/tz";
import { freeReschedulesLeft, recordReschedule } from "@/lib/reschedule";
import { RESCHEDULE_FEE, RESCHEDULE_FREE } from "@/lib/content";
import { sendEmail, sendWhatsApp } from "@/lib/notify";

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
      rescheduledAt: b.rescheduledAt ? b.rescheduledAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null,
      prevDateLabel: b.prevDateLabel,
      prevTime: b.prevTime,
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

  // Staff reschedule. mode "free" → uses one of the player's free reschedules
  // (deducted from their account). mode "charge" → if free left, use it; else
  // send a ₹50 Razorpay/pay link to WhatsApp + email and apply once paid.
  if (action === "reschedule") {
    if (existing.checkedInAt) return NextResponse.json({ error: "This pass has already been used — it can't be changed." }, { status: 409 });
    const dateKey = b.dateKey ? String(b.dateKey) : existing.dateKey;
    const startHour = b.startHour != null ? Number(b.startHour) : existing.startHour;
    const durationHrs = b.durationHrs != null ? Math.max(1, Number(b.durationHrs)) : existing.durationHrs;
    const mode = b.mode === "charge" ? "charge" : "free";
    if (!dateKey || startHour == null) return NextResponse.json({ error: "Pick a date and start time." }, { status: 400 });
    if (startHour < 0 || startHour > 23) return NextResponse.json({ error: "Start time is out of range." }, { status: 400 });
    if (slotIsPast(dateKey, startHour)) return NextResponse.json({ error: "You can't move a booking to a time that's already passed." }, { status: 400 });

    const apply = async () => prisma.booking.update({
      where: { id },
      data: {
        dateKey,
        dateLabel: fmtDateShort(new Date(`${dateKey}T00:00:00`)),
        startHour: Number(startHour),
        durationHrs,
        duration: `${durationHrs} hr`,
        time: slotRange(startHour, durationHrs) || existing.time,
        kickoffAt: istDate(dateKey, Number(startHour)),
        rescheduledAt: new Date(),
        prevDateLabel: existing.dateLabel,
        prevTime: slotRange(existing.startHour, existing.durationHrs) || existing.time,
        pendingReschedule: null,
        status: existing.status === "cancelled" ? existing.status : "upcoming",
      },
    });

    const freeLeft = existing.userId ? await freeReschedulesLeft(existing.userId) : RESCHEDULE_FREE;

    // Charge mode with no free reschedules left → require payment first.
    if (mode === "charge" && freeLeft <= 0) {
      const pending = { dateKey, startHour: Number(startHour), durationHrs };
      await prisma.booking.update({ where: { id }, data: { pendingReschedule: JSON.stringify(pending) } });
      const origin = new URL(req.url).origin;
      const link = `${origin}/reschedule/${id}/pay`;
      const fromLbl = `${existing.dateLabel} · ${slotRange(existing.startHour, existing.durationHrs) || existing.time}`;
      const toLbl = `${fmtDateShort(new Date(`${dateKey}T00:00:00`))} · ${slotRange(startHour, durationHrs)}`;
      const u = existing.userId ? await prisma.user.findUnique({ where: { id: existing.userId } }) : null;
      const email = u?.email || existing.contactEmail;
      const phone = u?.phone || existing.contactPhone;
      const msg = `Turfie: to move your booking ${id} from ${fromLbl} to ${toLbl}, please pay the ₹${RESCHEDULE_FEE} reschedule fee here: ${link}`;
      const [emailed, whatsApped] = await Promise.all([
        email ? sendEmail(email, "Confirm your Turfie reschedule (₹" + RESCHEDULE_FEE + ")", `<p>${msg}</p>`) : Promise.resolve(false),
        phone ? sendWhatsApp(phone, msg) : Promise.resolve(false),
      ]);
      return NextResponse.json({ ok: true, charged: true, link, sent: { email: emailed, whatsapp: whatsApped }, fee: RESCHEDULE_FEE });
    }

    // Free (or charge with free left): apply now and consume a free reschedule.
    if (existing.userId) await recordReschedule("u:" + existing.userId);
    const updated = await apply();
    return NextResponse.json({ booking: rowToBooking(updated), freeLeft: existing.userId ? await freeReschedulesLeft(existing.userId) : null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
