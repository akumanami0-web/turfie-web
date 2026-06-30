import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slotRange, fmtDateShort } from "@/lib/format";
import { istDate, slotIsPast } from "@/lib/tz";

/** Apply a charge-reschedule once the ₹50 fee is paid. The payment link points
    here; in this demo the pay page confirms payment then calls this to apply the
    pending move. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!existing.pendingReschedule) return NextResponse.json({ error: "Nothing to confirm — this reschedule may already be done." }, { status: 409 });

  let pending: { dateKey: string; startHour: number; durationHrs: number };
  try { pending = JSON.parse(existing.pendingReschedule); } catch { return NextResponse.json({ error: "Invalid reschedule." }, { status: 400 }); }
  const { dateKey, startHour, durationHrs } = pending;
  if (slotIsPast(dateKey, startHour)) {
    await prisma.booking.update({ where: { id }, data: { pendingReschedule: null } });
    return NextResponse.json({ error: "That slot has already passed — please ask for a new time." }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      dateKey,
      dateLabel: fmtDateShort(new Date(`${dateKey}T00:00:00`)),
      startHour,
      durationHrs,
      duration: `${durationHrs} hr`,
      time: slotRange(startHour, durationHrs) || existing.time,
      kickoffAt: istDate(dateKey, startHour),
      rescheduledAt: new Date(),
      prevDateLabel: existing.dateLabel,
      prevTime: slotRange(existing.startHour, existing.durationHrs) || existing.time,
      pendingReschedule: null,
      status: existing.status === "cancelled" ? existing.status : "upcoming",
    },
  });
  return NextResponse.json({ ok: true, dateLabel: updated.dateLabel, time: updated.time });
}
