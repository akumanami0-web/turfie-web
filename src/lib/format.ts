// ── Formatting & date helpers (shared client/server) ──

/** ₹ with Indian digit grouping. */
export const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

/** Compact ₹ for dashboards (₹1.2k / ₹3.4L). */
export function inrK(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2).replace(/\.00$/, "") + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return "₹" + n;
}

/** "7:00 AM" from an integer hour (handles after-midnight hours ≥24). */
export function fmtHour(h: number) {
  h = ((h % 24) + 24) % 24;
  const ap = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${ap}`;
}

/** Compact hour label, e.g. "6 PM", "12 AM", "1 AM". */
export function hourShort(h: number) {
  h = ((h % 24) + 24) % 24;
  const ap = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ap}`;
}

/** Start–end range for a booking of `dur` hours, e.g. "6 PM – 8 PM". */
export function hourRange(start: number, dur: number) {
  return `${hourShort(start)} – ${hourShort(start + dur)}`;
}

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type DayCell = {
  key: string;
  dow: string;
  dnum: number;
  mon: string;
  label: string;
};

/** Next `n` days starting today, with display labels. */
export function nextDays(n = 14, from = new Date()): DayCell[] {
  const out: DayCell[] = [];
  const base = new Date(from);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      key: localDateKey(d),
      dow: DOW[d.getDay()],
      dnum: d.getDate(),
      mon: MON[d.getMonth()],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`,
    });
  }
  return out;
}

/** yyyy-mm-dd in local time (avoids UTC off-by-one from toISOString). */
export function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtDateShort(d: Date) {
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
}

export function mmss(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function monthKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
