import "server-only";
import { prisma } from "./prisma";
import { heldHours } from "./locks";
import { synthTaken, turfHours } from "./turf-utils";
import type { Turf } from "./types";

export type Availability = {
  hours: number[];
  taken: number[]; // confirmed/booked or demo-busy
  held: { hour: number; until: number }[]; // held by OTHER owners
};

/** Merge demo-busy + real confirmed bookings + active foreign holds. */
export async function getAvailability(turf: Turf, field: string, dateKey: string, owner?: string): Promise<Availability> {
  const hours = turfHours(turf);

  const takenSet = new Set<number>(synthTaken(turf, field, dateKey));

  // real confirmed bookings occupy their hour range
  const bookings = await prisma.booking.findMany({
    where: { turfId: turf.id, field, dateKey, status: { in: ["upcoming", "completed"] } },
  });
  for (const b of bookings) {
    if (b.startHour == null) continue;
    for (let i = 0; i < (b.durationHrs || 1); i++) takenSet.add(b.startHour + i);
  }

  const held = (await heldHours(turf.id, field, dateKey, owner)).filter((h) => !h.mine);

  return {
    hours,
    taken: [...takenSet].sort((a, b) => a - b),
    held: held.map((h) => ({ hour: h.hour, until: h.until })),
  };
}
