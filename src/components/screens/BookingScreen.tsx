"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/providers/toast";
import { turfHours, turfFields } from "@/lib/turf-utils";
import { nextDays, fmtHour, inr, mmss } from "@/lib/format";
import type { Turf } from "@/lib/types";

const secHd: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "uppercase", margin: "0 0 14px", whiteSpace: "nowrap" };
const pStep = (disabled: boolean): React.CSSProperties => ({
  width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0,
  border: "1.5px solid var(--color-ink)", background: "var(--color-canvas)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1,
});

function Row({ label, val }: { label: string; val: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", fontFamily: "var(--font-body)", fontSize: 14.5 }}>
      <span style={{ color: "var(--color-mute)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--color-ink)", textAlign: "right", whiteSpace: "nowrap" }}>{val}</span>
    </div>
  );
}
function Lgnd({ c, b, label }: { c: string; b?: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 13, height: 13, borderRadius: 4, background: c, border: `1.5px solid ${b || "transparent"}` }} />{label}
    </span>
  );
}

export function BookingScreen({ turf: t }: { turf: Turf }) {
  const router = useRouter();
  const toast = useToast();
  const days = useMemo(() => nextDays(30), []);
  const fields = turfFields(t);
  const hours = turfHours(t);

  const [field, setField] = useState("A");
  const [date, setDate] = useState(days[0].key);
  const [duration, setDuration] = useState(1);
  const [start, setStart] = useState<number | null>(null);
  const defaultTeam = t.primary === "football" ? 10 : t.primary === "cricket" ? 8 : t.primary === "tennis" ? 2 : 4;
  const [players, setPlayers] = useState(defaultTeam);
  const [taken, setTaken] = useState<number[]>([]);
  const [held, setHeld] = useState<{ hour: number; until: number }[]>([]);
  const [, setTick] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  // carry the home-search date if still in range
  useEffect(() => {
    let wanted: string | null = null;
    try { wanted = localStorage.getItem("turfie.searchDate"); } catch {}
    if (wanted && days.some((d) => d.key === wanted)) setDate(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAvail = useCallback(async () => {
    const res = await fetch(`/api/availability?turfId=${t.id}&field=${field}&date=${date}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setTaken(data.taken || []);
      setHeld(data.held || []);
    }
  }, [t.id, field, date]);

  useEffect(() => { setStart(null); fetchAvail(); }, [field, date, fetchAvail]);
  useEffect(() => {
    const tick = setInterval(() => setTick((n) => n + 1), 1000);
    const poll = setInterval(fetchAvail, 8000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [fetchAvail]);

  // place the selected date second, previous day to its left, on first render
  useEffect(() => {
    const idx = days.findIndex((d) => d.key === date);
    if (stripRef.current && idx > 0) stripRef.current.scrollLeft = (idx - 1) * 86;
  }, [date, days]);

  const heldMap = useMemo(() => new Map(held.map((h) => [h.hour, h])), [held]);
  const takenSet = useMemo(() => new Set(taken), [taken]);
  const hourOpen = (h: number) => hours.includes(h);
  const heldByOther = (h: number) => heldMap.get(h) || null;
  const hourFree = (h: number) => hourOpen(h) && !takenSet.has(h) && !heldByOther(h);
  const canStart = (h: number, dur: number) => { for (let i = 0; i < dur; i++) if (!hourFree(h + i)) return false; return true; };

  useEffect(() => { if (start != null && !canStart(start, duration)) setStart(null); }, [duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = start != null ? Array.from({ length: duration }, (_, i) => start + i) : [];
  const total = t.price * duration;
  const perPlayer = Math.ceil(total / players);
  const timeRange = start != null ? `${fmtHour(start)} – ${fmtHour(start + duration)}` : "—";

  function pick(h: number) {
    if (takenSet.has(h)) return;
    if (heldByOther(h)) { toast("That slot is being booked by another player", "warning"); return; }
    if (!canStart(h, duration)) { toast(duration === 2 ? "Pick a slot with 2 free hours in a row" : "That slot is unavailable", "warning"); return; }
    setStart(h);
  }

  async function continueToPay() {
    if (start == null) return;
    setSubmitting(true);
    const bookHours = selected;
    const res = await fetch("/api/locks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turfId: t.id, field, dateKey: date, hours: bookHours }),
    });
    if (res.status === 409) { toast("That slot was just taken — pick another", "error"); await fetchAvail(); setSubmitting(false); return; }
    if (!res.ok) { toast("Couldn't hold that slot. Try again.", "error"); setSubmitting(false); return; }
    const { until } = await res.json();
    const draft = {
      turfId: t.id, field, unit: t.unit, dateKey: date,
      dateLabel: days.find((d) => d.key === date)?.label,
      startHour: start, hours: bookHours, slotLabel: timeRange,
      duration, total, players, perPlayer, until,
    };
    try { sessionStorage.setItem("turfie.draft", JSON.stringify(draft)); } catch {}
    router.push("/checkout");
  }

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingBottom: 64 }}>
      <Container style={{ paddingTop: 24 }}>
        <button onClick={() => router.push(`/turf/${t.id}`)} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--color-body)", padding: "4px 0", marginBottom: 14 }}>
          <Icon name="arrowLeft" size={18} /> Back to {t.name}
        </button>

        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr", gap: 28, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Eyebrow style={{ marginBottom: 8 }}>Book your slot</Eyebrow>
              <Display size={34}>{t.name}</Display>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="clock" size={15} color="var(--color-mute)" /> {t.openLabel}
              </div>
            </div>

            {/* field / court */}
            <Card tone="white" style={{ padding: 22 }}>
              <h3 style={secHd}>1 · Choose a {t.unit.toLowerCase()}</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {fields.map((f) => (
                  <button key={f} onClick={() => setField(f)} style={{
                    padding: "12px 18px", borderRadius: "var(--radius-lg)", cursor: "pointer", whiteSpace: "nowrap",
                    border: field === f ? "1.5px solid var(--color-ink)" : "1.5px solid var(--border-subtle)",
                    background: field === f ? "var(--color-ink)" : "var(--color-canvas)", color: field === f ? "var(--color-canvas)" : "var(--color-ink)",
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "uppercase",
                  }}>{t.unit} {f}</button>
                ))}
              </div>
              {fields.length > 1 && <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", marginTop: 10 }}>This venue has {fields.length} {t.unit.toLowerCase()}s — availability differs per {t.unit.toLowerCase()}.</div>}
            </Card>

            {/* date strip */}
            <Card tone="white" style={{ padding: 22 }}>
              <h3 style={secHd}>2 · Choose a date</h3>
              <div ref={stripRef} className="t-scroll-x" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {days.map((d) => {
                  const on = d.key === date;
                  return (
                    <button key={d.key} onClick={() => setDate(d.key)} style={{
                      flexShrink: 0, width: 76, padding: "12px 6px", borderRadius: "var(--radius-lg)", cursor: "pointer",
                      border: on ? "1.5px solid var(--color-ink)" : "1.5px solid var(--border-subtle)",
                      background: on ? "var(--color-ink)" : "var(--color-canvas)", color: on ? "var(--color-canvas)" : "var(--color-ink)",
                      fontFamily: "var(--font-body)", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{d.dow}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>{d.dnum}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{d.mon}</div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* duration */}
            <Card tone="white" style={{ padding: 22 }}>
              <h3 style={secHd}>3 · Duration</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[1, 2].map((d) => (
                  <Chip key={d} selected={duration === d} onClick={() => setDuration(d)}>{`${d} ${d > 1 ? "hrs" : "hr"}`}</Chip>
                ))}
              </div>
              {duration === 2 && <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", marginTop: 10 }}>Pick a start time with two free hours in a row — both will be reserved.</div>}
            </Card>

            {/* slots */}
            <Card tone="white" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <h3 style={{ ...secHd, marginBottom: 0 }}>4 · Pick a slot</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-mute)" }}>
                  <Lgnd c="var(--color-canvas)" b="var(--color-ink)" label="Available" />
                  <Lgnd c="var(--color-ink)" label="Selected" />
                  <Lgnd c="var(--color-warning-pale)" label="Held" />
                  <Lgnd c="var(--color-canvas-soft)" label="Booked" />
                </div>
              </div>
              <div className="t-slot-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(98px, 1fr))", gap: 10 }}>
                {hours.map((h) => {
                  const isTaken = takenSet.has(h);
                  const other = heldByOther(h);
                  const on = selected.includes(h);
                  const blocked = !isTaken && !other && !on && !canStart(h, duration);
                  const disabled = (isTaken || !!other || blocked) && !on;
                  let bg = "var(--color-canvas)", col = "var(--color-ink)", bd = "var(--border-subtle)", dec = "none", op = 1;
                  if (on) { bg = "var(--color-ink)"; col = "var(--color-canvas)"; bd = "var(--color-ink)"; }
                  else if (other) { bg = "var(--color-warning-pale)"; col = "var(--color-warning-deep)"; bd = "transparent"; }
                  else if (isTaken) { bg = "var(--color-canvas-soft)"; col = "var(--color-mute)"; bd = "transparent"; dec = "line-through"; }
                  else if (blocked) { bg = "var(--color-canvas)"; col = "var(--color-mute)"; bd = "var(--border-subtle)"; op = 0.5; }
                  return (
                    <button key={h} disabled={disabled} onClick={() => pick(h)}
                      title={other ? "Being booked by another player" : isTaken ? "Already booked" : blocked ? "Not enough consecutive time" : ""}
                      style={{ padding: "12px 6px", borderRadius: "var(--radius-md)", border: `1.5px solid ${bd}`, background: bg, color: col, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, textDecoration: dec, opacity: op, position: "relative" }}>
                      {fmtHour(h)}
                      {other && <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{mmss(other.until - Date.now())} held</div>}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* summary */}
          <div style={{ position: "sticky", top: 92 }}>
            <Card tone="white" style={{ padding: 24, border: "1px solid var(--color-ink)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, textTransform: "uppercase", margin: "0 0 16px" }}>Booking summary</h3>
              <Row label="Turf" val={t.name} />
              <Row label={t.unit} val={`${t.unit} ${field}`} />
              <Row label="Date" val={days.find((d) => d.key === date)?.label} />
              <Row label="Time" val={timeRange} />
              <Row label="Duration" val={`${duration} hr`} />
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "14px 0" }} />
              <Row label="Rate" val={`${inr(t.price)} × ${duration}h`} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>Total</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28 }}>{inr(total)}</span>
              </div>

              <div style={{ marginTop: 14, padding: "13px 14px", background: "var(--color-canvas-soft)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--color-ink)" }}>How many players?</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setPlayers((p) => Math.max(2, p - 1))} disabled={players <= 2} aria-label="Fewer players" style={pStep(players <= 2)}><Icon name="minus" size={16} /></button>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, minWidth: 22, textAlign: "center" }}>{players}</span>
                    <button onClick={() => setPlayers((p) => Math.min(22, p + 1))} disabled={players >= 22} aria-label="More players" style={pStep(players >= 22)}><Icon name="plus" size={16} /></button>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)" }}>Each player pays</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>{inr(perPlayer)}</span>
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--color-mute)", marginTop: 4 }}>{inr(total)} split between {players} players</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, padding: "11px 14px", background: "var(--color-primary-pale)", borderRadius: "var(--radius-lg)" }}>
                <Icon name="shield" size={17} color="var(--color-ink-deep)" />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-ink-deep)", lineHeight: 1.4 }}>Your slot is held for 10 minutes once you continue to pay.</span>
              </div>

              <Button fullWidth size="lg" style={{ marginTop: 16 }} disabled={start == null || submitting} onClick={continueToPay} iconRight={<Icon name="arrowRight" size={18} />}>
                {submitting ? "Holding your slot…" : start != null ? "Continue to pay" : "Select a slot"}
              </Button>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", textAlign: "center", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="shield" size={14} color="var(--color-positive)" /> Free cancellation up to 24h before kick-off
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
