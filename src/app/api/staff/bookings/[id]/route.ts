import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { rowToBooking } from "@/lib/bookings";

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
