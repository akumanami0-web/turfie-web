import { istEpoch } from "./tz";

// Derived booking phase. The stored `status` is only upcoming/completed/cancelled
// and isn't updated by a cron, so we compute the live phase from the slot time.
export type Phase = "cancelled" | "checkedin" | "completed" | "missed" | "upcoming";

export function bookingPhase(
  dateKey: string | null,
  startHour: number | null,
  durationHrs: number,
  status: string,
  checkedIn: boolean,
  now: number = Date.now(),
): Phase {
  if (status === "cancelled") return "cancelled";
  let ended = false;
  if (dateKey != null && startHour != null) {
    const end = istEpoch(dateKey, startHour) + Math.max(1, durationHrs) * 3_600_000;
    ended = now > end;
  } else if (status === "completed") {
    ended = true;
  }
  if (checkedIn) return ended ? "completed" : "checkedin";
  if (ended) return "missed";
  return "upcoming";
}

/** Badge label. A "missed" booking still reads "Completed" on the badge — the
    fact it was missed is only spelled out in the detail view. */
export const PHASE_LABEL: Record<Phase, string> = {
  cancelled: "Cancelled",
  checkedin: "Checked in",
  completed: "Completed",
  missed: "Completed",
  upcoming: "Upcoming",
};
