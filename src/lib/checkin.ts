import "server-only";

// Check-in can happen at most 30 minutes before the slot starts, and never
// after it has finished. A pass with even 1 minute of play left is still valid.
const EARLY_MS = 30 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export type CheckinWindow = { opensAt: number | null; closesAt: number | null };

/** Booking: opens 30 min before kickoff, closes when the booked time ends. */
export function bookingWindow(kickoffAt: Date | null, durationHrs: number): CheckinWindow {
  if (!kickoffAt) return { opensAt: null, closesAt: null };
  const start = kickoffAt.getTime();
  return { opensAt: start - EARLY_MS, closesAt: start + Math.max(1, durationHrs) * HOUR_MS };
}

/** Battle: opens 30 min before kickoff; tournaments run long so allow a 12h window. */
export function battleWindow(startAt: Date | null): CheckinWindow {
  if (!startAt) return { opensAt: null, closesAt: null };
  const start = startAt.getTime();
  return { opensAt: start - EARLY_MS, closesAt: start + 12 * HOUR_MS };
}

function human(ms: number): string {
  const mins = Math.ceil(ms / 60000);
  if (mins >= 60 * 24) return `${Math.round(mins / (60 * 24))} day(s)`;
  if (mins >= 120) return `${Math.round(mins / 60)} hours`;
  if (mins >= 60) return "about an hour";
  return `${mins} min`;
}

/** Whether check-in is allowed right now, with a human reason when it isn't. */
export function windowState(now: number, w: CheckinWindow): { eligible: boolean; reason: string | null } {
  if (w.opensAt == null || w.closesAt == null) return { eligible: true, reason: null };
  if (now < w.opensAt) return { eligible: false, reason: `Too early — check-in opens 30 min before the start (in ${human(w.opensAt - now)}).` };
  if (now > w.closesAt) return { eligible: false, reason: "This slot has already ended — check-in is closed." };
  return { eligible: true, reason: null };
}
