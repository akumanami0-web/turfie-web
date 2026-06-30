// Turfie operates in India — all slot hours are IST wall-clock. The server runs
// in UTC, so naively building `new Date("YYYY-MM-DDT15:00:00")` would be parsed
// as 15:00 UTC, not 15:00 IST. These helpers convert an IST date+hour to the
// correct absolute instant (epoch ms) regardless of the server timezone.

export const IST_OFFSET_MIN = 330; // UTC+5:30, no DST

/** Absolute instant (epoch ms) for a given IST date (yyyy-mm-dd) + hour. */
export function istEpoch(dateKey: string, hour: number): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  return Date.UTC(y, m - 1, d, hour, 0, 0) - IST_OFFSET_MIN * 60_000;
}

/** A Date at the IST date+hour, correct in absolute terms. */
export function istDate(dateKey: string, hour: number): Date {
  return new Date(istEpoch(dateKey, hour));
}
