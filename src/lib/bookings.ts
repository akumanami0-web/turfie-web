import "server-only";
import { prisma } from "./prisma";
import type { Booking } from "./types";

type BookingRow = Awaited<ReturnType<typeof prisma.booking.findFirst>>;

export function rowToBooking(b: NonNullable<BookingRow>): Booking {
  return {
    id: b.id,
    turfId: b.turfId,
    field: b.field,
    unit: b.unit,
    dateKey: b.dateKey,
    dateLabel: b.dateLabel,
    time: b.time,
    startHour: b.startHour,
    duration: b.duration,
    durationHrs: b.durationHrs,
    players: b.players,
    status: b.status as Booking["status"],
    price: b.price,
    sport: b.sport,
    split: b.split,
    kickoffAt: b.kickoffAt ? b.kickoffAt.getTime() : null,
    contactName: b.contactName,
    contactPhone: b.contactPhone,
    contactEmail: b.contactEmail,
    refundMethod: b.refundMethod,
    refundPct: b.refundPct,
    refundAmount: b.refundAmount,
    cancelledAt: b.cancelledAt ? b.cancelledAt.getTime() : null,
    checkedInAt: b.checkedInAt ? b.checkedInAt.getTime() : null,
  };
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const rows = await prisma.booking.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map(rowToBooking);
}
