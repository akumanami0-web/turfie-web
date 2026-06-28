"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/toast";
import { refundQuote, RESCHEDULE_FREE, RESCHEDULE_FEE } from "@/lib/content";
import { turfHours } from "@/lib/turf-utils";
import { nextDays, hourRange, slotRange, inr } from "@/lib/format";
import type { Booking, Turf } from "@/lib/types";

function statusBadge(s: string) {
  if (s === "upcoming") return <Badge variant="positive">Upcoming</Badge>;
  if (s === "completed") return <Badge variant="neutral">Completed</Badge>;
  return <Badge variant="negative">Cancelled</Badge>;
}

function BookingRow({ b, turf, onCancel, onReschedule, onRebook, onView, onTrack }: {
  b: Booking; turf: Turf;
  onCancel: (b: Booking) => void; onReschedule: (b: Booking) => void;
  onRebook: (b: Booking) => void; onView: (b: Booking) => void; onTrack: () => void;
}) {
  return (
    <Card tone="white" padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      <CourtArt sport={b.sport} height={150} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, lineHeight: 1.15 }}>{turf.name}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", marginTop: 2 }}>{turf.area} · {b.id}</div>
          </div>
          {statusBadge(b.status)}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="calendar" size={15} color="var(--color-mute)" />{b.dateLabel}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={15} color="var(--color-mute)" />{slotRange(b.startHour, b.durationHrs) || b.time} · {b.duration}</span>
          {b.unit && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="compass" size={15} color="var(--color-mute)" />{b.unit} {b.field}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, marginTop: "auto", paddingTop: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>{inr(b.price)}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {b.status === "upcoming" && (<>
              <Button size="sm" variant="ghost" onClick={() => onCancel(b)}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={() => onReschedule(b)} iconLeft={<Icon name="calendar" size={15} />}>Reschedule</Button>
            </>)}
            {b.status === "completed" && (<>
              <Button size="sm" variant="tertiary" onClick={() => onRebook(b)}>Rebook</Button>
              <Button size="sm" variant="tertiary" onClick={() => onView(b)}>View turf</Button>
            </>)}
            {b.status === "cancelled" && (<>
              <Button size="sm" variant="ghost" onClick={onTrack} iconLeft={<Icon name="refresh" size={15} />}>Track refund</Button>
              <Button size="sm" variant="tertiary" onClick={() => onView(b)}>View turf</Button>
            </>)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CancelModal({ b, turf, onClose, onConfirm }: { b: Booking; turf: Turf; onClose: () => void; onConfirm: () => void }) {
  const q = refundQuote(b.kickoffAt);
  const refund = Math.round((b.price * q.pct) / 100);
  const noteTone = q.pct === 100 ? "var(--color-primary-pale)" : q.pct === 50 ? "var(--color-warning-pale)" : "var(--color-negative-pale)";
  const noteColor = q.pct === 0 ? "var(--color-negative-deep)" : "var(--color-ink-deep)";
  return (
    <ModalShell onClose={onClose} maxWidth={440}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-warning-pale)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
        <Icon name="x" size={30} color="var(--color-warning-deep)" stroke={2.6} />
      </div>
      <Display size={24} style={{ textAlign: "center", marginBottom: 10 }}>Cancel this booking?</Display>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, color: "var(--color-body)", textAlign: "center", margin: "0 0 16px" }}>
        {turf.name} · {b.dateLabel} · {b.time}
      </p>
      <div style={{ background: noteTone, borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, color: noteColor }}>{q.label}</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: noteColor }}>{q.pct === 0 ? "₹0" : inr(refund)}</span>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, lineHeight: 1.45, color: noteColor, opacity: 0.85, margin: "6px 0 0" }}>
          {q.pct === 100 && "Cancelling more than 24h before kick-off — full refund to your Turfie wallet."}
          {q.pct === 50 && "Cancelling between 4h and 24h before kick-off — 50% refund to your Turfie wallet."}
          {q.pct === 0 && "Cancelling less than 4h before kick-off — this booking is non-refundable."}
          {q.pct > 0 && " Arrives in 3–5 working days."}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button fullWidth size="lg" onClick={onClose}>Keep my booking</Button>
        <button onClick={onConfirm} style={{ width: "100%", padding: "14px", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--color-warning-deep)", background: "transparent", color: "var(--color-warning-deep)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Yes, cancel booking
        </button>
      </div>
    </ModalShell>
  );
}

function RescheduleModal({ b, turf, resched, onClose, onConfirm }: { b: Booking; turf: Turf; resched: { freeLeft: number; fee: number }; onClose: () => void; onConfirm: (patch: { dateLabel: string; dateKey: string; time: string; startHour: number; duration: string; durationHrs: number }) => void }) {
  const toast = useToast();
  const days = useMemo(() => nextDays(30), []);
  const hours = turfHours(turf);
  const durHrs = /2/.test(b.duration) ? 2 : 1;
  const field = b.field || "A";
  const [date, setDate] = useState(days[0].key);
  const [start, setStart] = useState<number | null>(null);
  const [taken, setTaken] = useState<number[]>([]);
  const [held, setHeld] = useState<number[]>([]);

  const fetchAvail = useCallback(async () => {
    const res = await fetch(`/api/availability?turfId=${turf.id}&field=${field}&date=${date}`, { cache: "no-store" });
    if (res.ok) { const d = await res.json(); setTaken(d.taken || []); setHeld((d.held || []).map((h: { hour: number }) => h.hour)); }
  }, [turf.id, field, date]);
  useEffect(() => { setStart(null); fetchAvail(); }, [date, fetchAvail]);

  const takenSet = useMemo(() => new Set(taken), [taken]);
  const heldSet = useMemo(() => new Set(held), [held]);
  const free = (h: number) => hours.includes(h) && !takenSet.has(h) && !heldSet.has(h);
  const canStart = (h: number) => { for (let i = 0; i < durHrs; i++) if (!free(h + i)) return false; return true; };
  const newLabel = days.find((d) => d.key === date)?.label || "";
  const newRange = start != null ? hourRange(start, durHrs) : null;

  function confirm() {
    if (start == null) return;
    onConfirm({ dateLabel: newLabel, dateKey: date, time: slotRange(start, durHrs)!, startHour: start, duration: `${durHrs} hr${durHrs > 1 ? "s" : ""}`, durationHrs: durHrs });
  }

  return (
    <ModalShell onClose={onClose} maxWidth={560}>
      <Eyebrow style={{ marginBottom: 6 }}>Reschedule</Eyebrow>
      <Display size={24} style={{ marginBottom: 4 }}>{turf.name}</Display>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", margin: "0 0 14px" }}>
        Currently {b.dateLabel} · {slotRange(b.startHour, b.durationHrs) || b.time} · {b.unit || "Field"} {field}. Pick a new date and time.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: "var(--radius-lg)", background: resched.fee === 0 ? "var(--color-primary-pale)" : "var(--color-warning-pale)", marginBottom: 18 }}>
        <Icon name={resched.fee === 0 ? "refresh" : "wallet"} size={17} color="var(--color-ink-deep)" />
        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-ink-deep)", lineHeight: 1.4 }}>
          {resched.fee === 0 ? `Free reschedule — ${resched.freeLeft} of ${RESCHEDULE_FREE} left this month.` : `You've used all ${RESCHEDULE_FREE} free reschedules this month. This one costs ${inr(RESCHEDULE_FEE)}.`}
        </span>
      </div>

      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)", marginBottom: 8 }}>New date</div>
      <div className="t-scroll-x" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 18 }}>
        {days.slice(0, 14).map((d) => {
          const on = d.key === date;
          return (
            <button key={d.key} onClick={() => setDate(d.key)} style={{ flexShrink: 0, width: 64, padding: "10px 6px", borderRadius: "var(--radius-lg)", cursor: "pointer", border: on ? "1.5px solid var(--color-ink)" : "1.5px solid var(--border-subtle)", background: on ? "var(--color-ink)" : "var(--color-canvas)", color: on ? "var(--color-canvas)" : "var(--color-ink)", fontFamily: "var(--font-body)", textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{d.dow}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>{d.dnum}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)", marginBottom: 8 }}>New time {durHrs === 2 ? "(2 hrs)" : ""}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, maxHeight: 220, overflowY: "auto" }}>
        {hours.map((h) => {
          const isTaken = takenSet.has(h) || heldSet.has(h);
          // One tile per start option, labelled with the full range; only the
          // chosen start lights up (matches the booking page).
          const on = start === h;
          const blocked = !on && !canStart(h);
          const disabled = (isTaken || blocked) && !on;
          let bg = "var(--color-canvas)", col = "var(--color-ink)", bd = "var(--border-subtle)", op = 1, dec = "none";
          if (on) { bg = "var(--color-ink)"; col = "var(--color-canvas)"; bd = "var(--color-ink)"; }
          else if (isTaken) { bg = "var(--color-canvas-soft)"; col = "var(--color-mute)"; bd = "transparent"; dec = "line-through"; }
          else if (blocked) { op = 0.45; }
          return (
            <button key={h} disabled={disabled} onClick={() => { if (!canStart(h)) { toast("Pick a free slot", "warning"); return; } setStart(h); }} style={{ padding: "10px 6px", borderRadius: "var(--radius-md)", border: `1.5px solid ${bd}`, background: bg, color: col, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, opacity: op, textDecoration: dec, whiteSpace: "nowrap" }}>
              {hourRange(h, durHrs)}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22 }} className="t-2btn">
        <Button variant="tertiary" fullWidth onClick={onClose}>Keep current</Button>
        <Button fullWidth disabled={start == null} onClick={confirm} iconRight={<Icon name="check" size={17} />}>
          {start == null ? "Pick a time" : resched.fee === 0 ? `Move to ${newRange}` : `Move to ${newRange} · ${inr(RESCHEDULE_FEE)}`}
        </Button>
      </div>
    </ModalShell>
  );
}

export function BookingsScreen({ initialBookings, turfs, reschedule }: { initialBookings: Booking[]; turfs: Turf[]; reschedule: { freeLeft: number; fee: number } }) {
  const router = useRouter();
  const toast = useToast();
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<{ type: "cancel" | "reschedule"; b: Booking } | null>(null);
  const turfMap = useMemo(() => new Map(turfs.map((t) => [t.id, t])), [turfs]);
  const tabs: [string, string][] = [["all", "All"], ["upcoming", "Upcoming"], ["completed", "Completed"], ["cancelled", "Cancelled"]];
  const list = bookings.filter((b) => filter === "all" || b.status === filter);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.ok ? (await res.json()).booking as Booking : null;
  }

  async function doCancel(b: Booking) {
    const updated = await patch(b.id, { action: "cancel" });
    setModal(null);
    if (updated) { setBookings((prev) => prev.map((x) => (x.id === b.id ? updated : x))); toast("Booking cancelled — refund initiated"); router.push("/account/refunds"); }
  }
  async function doReschedule(b: Booking, p: { dateLabel: string; dateKey: string; time: string; startHour: number; duration: string; durationHrs: number }) {
    const updated = await patch(b.id, { action: "reschedule", ...p });
    setModal(null);
    if (updated) { setBookings((prev) => prev.map((x) => (x.id === b.id ? updated : x))); toast("Booking rescheduled — confirmation sent"); }
  }

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <Eyebrow style={{ marginBottom: 8 }}>Your games</Eyebrow>
        <Display size={38} style={{ marginBottom: 20 }}>My bookings</Display>
        <div className="t-scroll-x" style={{ display: "flex", gap: 10, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map(([id, label]) => <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</Chip>)}
        </div>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <Icon name="calendar" size={40} color="var(--color-mute)" style={{ margin: "0 auto 14px" }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-body)", marginBottom: 18 }}>No {filter !== "all" ? filter : ""} bookings yet.</p>
            <Button onClick={() => router.push("/browse")}>Find a turf</Button>
          </div>
        ) : (
          <div className="t-bookings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {list.map((b) => {
              const turf = turfMap.get(b.turfId);
              if (!turf) return null;
              return (
                <BookingRow key={b.id} b={b} turf={turf}
                  onCancel={(bk) => setModal({ type: "cancel", b: bk })}
                  onReschedule={(bk) => setModal({ type: "reschedule", b: bk })}
                  onRebook={(bk) => router.push(`/turf/${bk.turfId}/book`)}
                  onView={(bk) => router.push(`/turf/${bk.turfId}`)}
                  onTrack={() => router.push("/account/refunds")} />
              );
            })}
          </div>
        )}
        {modal?.type === "cancel" && turfMap.get(modal.b.turfId) && (
          <CancelModal b={modal.b} turf={turfMap.get(modal.b.turfId)!} onClose={() => setModal(null)} onConfirm={() => doCancel(modal.b)} />
        )}
        {modal?.type === "reschedule" && turfMap.get(modal.b.turfId) && (
          <RescheduleModal b={modal.b} turf={turfMap.get(modal.b.turfId)!} resched={reschedule} onClose={() => setModal(null)} onConfirm={(p) => doReschedule(modal.b, p)} />
        )}
      </Container>
    </div>
  );
}
