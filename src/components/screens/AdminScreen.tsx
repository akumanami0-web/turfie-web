"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar, Stars, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { inr, inrK } from "@/lib/format";
import type { Turf } from "@/lib/types";

type LiveBooking = { id: string; who: string; initials: string; turf: string; unit: string; field: string; time: string; dur: number; price: number; status: string; tone: "positive" | "neutral" | "negative"; when: string; method: string };

function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
const DOW7 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PERIODS = [
  { value: "today", label: "Today", mult: 1 },
  { value: "week", label: "This week", mult: 6.4 },
  { value: "month", label: "This month", mult: 27 },
];

function turfMetrics(turf: Turf, mult: number) {
  const h = hashStr(turf.id);
  const bookingsToday = 4 + (h % 9);
  const occupancy = 46 + (h % 49);
  const delta = ((h >> 3) % 23) - 7;
  const bookings = Math.round(bookingsToday * mult);
  const revenue = Math.round(bookingsToday * mult * turf.price * (1 + (h % 5) / 12));
  return { bookingsToday, bookings, occupancy, delta, revenue };
}

function bookingLedger(turfs: Turf[]): LiveBooking[] {
  const names: [string, string][] = [["Rohan S.", "RS"], ["Aisha K.", "AK"], ["Manish J.", "MJ"], ["Sahil K.", "SK"], ["Priya L.", "PL"], ["Dev V.", "DV"], ["Tara N.", "TN"]];
  const times = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"];
  const statuses: [string, "positive" | "neutral" | "negative"][] = [["confirmed", "positive"], ["upcoming", "neutral"], ["confirmed", "positive"], ["completed", "neutral"], ["cancelled", "negative"]];
  const whens = ["Today", "Today", "Tomorrow", "Today", "Yesterday"];
  const pay = ["UPI", "Card", "Wallet"];
  const out: (LiveBooking & { sortk: number })[] = [];
  turfs.forEach((t, i) => {
    const h = hashStr(t.id + "led");
    const n = 3 + (h % 4);
    for (let j = 0; j < n; j++) {
      const k = h + j * 41 + i * 7;
      const who = names[k % names.length];
      const st = statuses[k % statuses.length];
      const fld = String.fromCharCode(65 + (k % Math.max(1, t.fieldCount)));
      const dur = 1 + (k % 2);
      out.push({ id: "TRF-" + (4000 + ((k * 37) % 5000)), turf: t.name, unit: t.unit, field: fld, who: who[0], initials: who[1], when: whens[k % whens.length], time: times[k % times.length], dur, price: t.price * dur, method: pay[k % pay.length], status: st[0], tone: st[1], sortk: k % 97 });
    }
  });
  return out.sort((a, b) => a.sortk - b.sortk);
}

function StatCard({ icon, label, value, delta, tone = "white" }: { icon: string; label: string; value: React.ReactNode; delta?: number | null; tone?: "white" | "dark" }) {
  const up = delta == null ? null : delta >= 0;
  return (
    <Card tone={tone} style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-lg)", background: tone === "dark" ? "rgba(159,232,112,.16)" : "var(--color-primary-pale)", display: "grid", placeItems: "center" }}>
          <Icon name={icon} size={22} color={tone === "dark" ? "var(--color-primary)" : "var(--color-ink-deep)"} />
        </div>
        {delta != null && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12.5, color: up ? "var(--color-positive)" : "var(--color-negative)" }}>
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, marginTop: 16, color: tone === "dark" ? "#fff" : "var(--color-ink)" }}>{value}</div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: tone === "dark" ? "rgba(255,255,255,.7)" : "var(--color-mute)", marginTop: 2 }}>{label}</div>
    </Card>
  );
}

function OccBar({ pct }: { pct: number }) {
  const tone = pct >= 75 ? "var(--color-primary)" : pct >= 50 ? "var(--color-warning)" : "var(--color-negative)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 99, background: "var(--color-canvas-soft)", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: tone, borderRadius: 99 }} />
      </div>
      <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "var(--color-ink)", width: 34, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

export function AdminScreen({ turfs: allTurfs, live = [] }: { turfs: Turf[]; live?: LiveBooking[] }) {
  const router = useRouter();
  const [scope, setScope] = useState("all");
  const [period, setPeriod] = useState("today");
  const [statusF, setStatusF] = useState("all");
  const mult = PERIODS.find((p) => p.value === period)!.mult;
  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase();

  const turfs = scope === "all" ? allTurfs : allTurfs.filter((t) => t.id === scope);
  const rows = turfs.map((t) => ({ turf: t, m: turfMetrics(t, mult) })).sort((a, b) => b.m.revenue - a.m.revenue);
  const totalRevenue = rows.reduce((s, r) => s + r.m.revenue, 0);
  const totalBookings = rows.reduce((s, r) => s + r.m.bookings, 0);
  const avgOcc = Math.round(rows.reduce((s, r) => s + r.m.occupancy, 0) / Math.max(1, rows.length));
  const totalFields = turfs.reduce((s, t) => s + (t.fieldCount || 1), 0);

  const series = DOW7.map((d) => {
    const h = hashStr(scope + d);
    const base = totalRevenue / (period === "today" ? 1 : period === "week" ? 6.4 : 27);
    return Math.round(base * (0.6 + (h % 70) / 100));
  });
  const maxRev = Math.max(...series, 1);

  const synthLedger = bookingLedger(turfs);
  const scopedLive = scope === "all" ? live : live.filter((b) => turfs.some((t) => t.name === b.turf));
  const ledger = [...scopedLive, ...synthLedger];
  const feed = ledger.slice(0, 6);
  const counts = ledger.reduce<Record<string, number>>((m, b) => { m[b.status] = (m[b.status] || 0) + 1; return m; }, {});
  const ledgerRows = statusF === "all" ? ledger : ledger.filter((b) => b.status === statusF);
  const statusTabs: [string, string, number][] = [["all", "All", ledger.length], ["upcoming", "Upcoming", counts.upcoming || 0], ["confirmed", "Confirmed", counts.confirmed || 0], ["completed", "Completed", counts.completed || 0], ["cancelled", "Cancelled", counts.cancelled || 0]];

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingBottom: 64 }}>
      <div style={{ background: "var(--color-ink)", paddingTop: 32, paddingBottom: 32 }}>
        <Container wide>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
            <div>
              <Eyebrow color="var(--color-primary)" style={{ marginBottom: 10 }}>Partner dashboard</Eyebrow>
              <Display size={36} style={{ color: "#fff" }}>Turfie partner network</Display>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "rgba(255,255,255,.7)", marginTop: 8 }}>
                Tracking {allTurfs.length} partnered venues · {allTurfs.reduce((s, t) => s + (t.fieldCount || 1), 0)} pitches & courts across Maharashtra
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ width: 190 }}>
                <Dropdown value={scope} onChange={setScope} options={[{ value: "all", label: "All turfs" }, ...allTurfs.map((t) => ({ value: t.id, label: t.name }))]} />
              </div>
              <div style={{ width: 150 }}>
                <Dropdown value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.label }))} />
              </div>
              <Button size="md" onClick={() => router.push("/list")} iconLeft={<Icon name="plus" size={17} />}>Add turf</Button>
            </div>
          </div>
        </Container>
      </div>

      <Container wide style={{ paddingTop: 24 }}>
        <div className="t-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard icon="wallet" label={`Revenue · ${periodLabel}`} value={inrK(totalRevenue)} delta={6} tone="dark" />
          <StatCard icon="ticket" label={`Bookings · ${periodLabel}`} value={totalBookings} delta={9} />
          <StatCard icon="compass" label="Avg occupancy" value={avgOcc + "%"} delta={3} />
          <StatCard icon="home" label="Active venues" value={`${turfs.length} · ${totalFields} courts`} delta={null} />
        </div>

        <div className="t-admin-grid" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20, alignItems: "start" }}>
          <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, textTransform: "uppercase", margin: 0, whiteSpace: "nowrap" }}>Turf performance</h3>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>Ranked by revenue · {periodLabel}</span>
            </div>
            <div className="t-scroll-x" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                <thead>
                  <tr>
                    {["Turf", "Bookings", "Occupancy", "Rating", "Revenue", ""].map((h, i) => (
                      <th key={h + i} style={{ textAlign: i === 0 ? "left" : i === 5 ? "right" : "left", padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-mute)", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ turf, m }) => (
                    <tr key={turf.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0 }}><CourtArt sport={turf.primary} height={40} /></div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, color: "var(--color-ink)", whiteSpace: "nowrap" }}>{turf.name}</div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", whiteSpace: "nowrap" }}>{turf.area} · {turf.fieldCount} {turf.unit.toLowerCase()}{turf.fieldCount > 1 ? "s" : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14 }}>{m.bookings}</td>
                      <td style={{ padding: "14px 16px" }}><OccBar pct={m.occupancy} /></td>
                      <td style={{ padding: "14px 16px" }}><Stars rating={turf.rating} size={13} /></td>
                      <td style={{ padding: "14px 16px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>{inrK(m.revenue)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button onClick={() => router.push(`/turf/${turf.id}`)} aria-label="View turf" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "var(--color-canvas)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                          <Icon name="arrowRight" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card tone="white" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase", margin: 0 }}>Revenue</h3>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>last 7 days</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, marginBottom: 16 }}>{inrK(series.reduce((s, v) => s + v, 0))}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
                {series.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                    <div title={inrK(v)} style={{ width: "100%", height: Math.max(6, (v / maxRev) * 96) + "px", background: i === series.length - 1 ? "var(--color-ink)" : "var(--color-primary)", borderRadius: "6px 6px 3px 3px" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--color-mute)" }}>{DOW7[i]}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase", margin: 0 }}>Latest bookings</h3>
                <Icon name="bell" size={18} color="var(--color-mute)" />
              </div>
              <div>
                {feed.map((b, i) => (
                  <div key={b.id + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", borderBottom: i < feed.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <Avatar initials={b.initials} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.who} · {b.turf}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>{b.unit} {b.field} · {b.time} · {b.dur} hr</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14 }}>{inr(b.price)}</div>
                      <Badge variant={b.tone} style={{ fontSize: 11, marginTop: 2 }}>{b.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card tone="white" style={{ padding: 0, overflow: "hidden", marginTop: 20 }}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, textTransform: "uppercase", margin: 0, whiteSpace: "nowrap" }}>Bookings</h3>
            <div className="t-scroll-x" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              {statusTabs.map(([id, label, n]) => {
                const on = statusF === id;
                return (
                  <button key={id} onClick={() => setStatusF(id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: "var(--radius-pill)", cursor: "pointer", whiteSpace: "nowrap", border: on ? "1.5px solid var(--color-ink)" : "1.5px solid var(--border-subtle)", background: on ? "var(--color-ink)" : "var(--color-canvas)", color: on ? "var(--color-canvas)" : "var(--color-ink)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5 }}>
                    {label}
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: on ? "rgba(255,255,255,.18)" : "var(--color-canvas-soft)", color: on ? "var(--color-canvas)" : "var(--color-mute)" }}>{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="t-scroll-x" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  {["Booking", "Player", "Turf", "Slot", "When", "Payment", "Amount", "Status"].map((h, i) => (
                    <th key={h} style={{ textAlign: i >= 6 ? "right" : "left", padding: "11px 16px", fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-mute)", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((b, i) => (
                  <tr key={b.id + i} style={{ borderBottom: i < ledgerRows.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, color: "var(--color-ink)", whiteSpace: "nowrap" }}>{b.id}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar initials={b.initials} size={30} />
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap" }}>{b.who}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)", whiteSpace: "nowrap" }}>{b.turf} · {b.unit} {b.field}</td>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)", whiteSpace: "nowrap" }}>{b.time} · {b.dur} hr</td>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)", whiteSpace: "nowrap" }}>{b.when}</td>
                    <td style={{ padding: "13px 16px", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", whiteSpace: "nowrap" }}>{b.method}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{inr(b.price)}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right" }}><Badge variant={b.tone} style={{ fontSize: 11 }}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ledgerRows.length === 0 && <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: "var(--font-body)", color: "var(--color-mute)" }}>No {statusF} bookings.</div>}
          </div>
        </Card>
      </Container>
    </div>
  );
}
