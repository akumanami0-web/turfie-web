import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getLockOwner } from "@/lib/owner";
import { rowToBooking } from "@/lib/bookings";
import { refundQuote } from "@/lib/content";
import { rescheduleStatus, recordReschedule } from "@/lib/reschedule";

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
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        refundMethod: "Turfie wallet",
        cancelledAt: new Date(),
        refundPct: q.pct,
        refundAmount: Math.round((existing.price * q.pct) / 100),
      },
    });
    return NextResponse.json({ booking: rowToBooking(updated) });
  }

  if (action === "reschedule") {
    const owner = await getLockOwner();
    const status = await rescheduleStatus(owner);
    await recordReschedule(owner);
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        dateLabel: String(body.dateLabel || existing.dateLabel),
        dateKey: body.dateKey ?? existing.dateKey,
        time: String(body.time || existing.time),
        startHour: body.startHour != null ? Number(body.startHour) : existing.startHour,
        duration: String(body.duration || existing.duration),
        durationHrs: body.durationHrs != null ? Number(body.durationHrs) : existing.durationHrs,
        kickoffAt:
          body.dateKey && body.startHour != null
            ? (() => {
                const k = new Date(`${body.dateKey}T00:00:00`);
                k.setHours(k.getHours() + Number(body.startHour));
                return k;
              })()
            : existing.kickoffAt,
      },
    });
    return NextResponse.json({ booking: rowToBooking(updated), fee: status.fee });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
