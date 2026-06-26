import type { Turf } from "./types";

/** Bookable hours for a turf (integers; may exceed 23 for after-midnight). */
export function turfHours(turf: Pick<Turf, "openH" | "closeH">): number[] {
  const out: number[] = [];
  for (let h = turf.openH; h < turf.closeH; h++) out.push(h);
  return out;
}

/** Field/court labels: ['A'] or ['A','B','C'…]. */
export function turfFields(turf: Pick<Turf, "fieldCount">): string[] {
  const n = Math.max(1, turf.fieldCount || 1);
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
}

/** Deterministic pseudo-random "taken" hours per (turf, field, date) — keeps
    the grid realistically busy on top of real bookings/locks. */
export function synthTaken(turf: Pick<Turf, "id" | "openH" | "closeH">, field: string, dateKey: string): number[] {
  const seed = `${turf.id}|${field}|${dateKey}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hours = turfHours(turf);
  const taken: number[] = [];
  hours.forEach((hr, i) => {
    if (((h >> (i % 30)) & 1) && ((h >> ((i + 5) % 30)) & 1)) taken.push(hr);
  });
  return taken;
}
