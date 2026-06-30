import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getLockOwner } from "@/lib/owner";
import { rowToBooking } from "@/lib/bookings";
import { refundQuote } from "@/lib/content";
import { rescheduleStatus, recordReschedule } from "@/lib/reschedule";
import { adjustWallet } from "@/lib/wallet-balance";
import { slotRange } from "@/lib/format";
import { istDate } from "@/lib/tz";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "cancel") {
    const q = refundQuote(existing.kickoffAt ? existing.kickoffAt.getTime() : null);
    const refundAmount = Math.round((existing.price * q.pct) / 100);
    const toWallet = body.refundMethod === "wallet";
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        refundMethod: refundAmount === 0 ? null : toWallet ? "Turfie wallet" : "original payment method",
        cancelledAt: new Date(),
        refundPct: q.pct,
        refundAmount,
      },
    });
    // Wallet refunds land instantly; original-method refunds follow the 3–5 day flow.
    let newUser = null;
    if (toWallet && refundAmount > 0) {
      const newBalance = await adjustWallet(user.id, refundAmount, "refund", `Refund for ${id}`);
      newUser = { ...user, walletBalance: newBalance };
    }
    return NextResponse.json({ booking: rowToBooking(updated), user: newUser });
  }

  if (action === "reschedule") {
    const owner = await getLockOwner();
    const status = await rescheduleStatus(owner);
    await recordReschedule(owner);
    const newDateKey = body.dateKey ?? existing.dateKey;
    const newStartHour = body.startHour != null ? Number(body.startHour) : existing.startHour;
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        dateLabel: String(body.dateLabel || existing.dateLabel),
        dateKey: newDateKey,
        time: String(body.time || existing.time),
        startHour: newStartHour,
        duration: String(body.duration || existing.duration),
        durationHrs: body.durationHrs != null ? Number(body.durationHrs) : existing.durationHrs,
        // Record where it moved from, so dashboards can show the change.
        rescheduledAt: new Date(),
        prevDateLabel: existing.dateLabel,
        prevTime: slotRange(existing.startHour, existing.durationHrs) || existing.time,
        kickoffAt: newDateKey && newStartHour != null ? istDate(newDateKey, Number(newStartHour)) : existing.kickoffAt,
      },
    });
    return NextResponse.json({ booking: rowToBooking(updated), fee: status.fee });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
