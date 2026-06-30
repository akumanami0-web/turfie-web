"use client";
import React, { Suspense, useState } from "react";
import { Card, Badge, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { ModalShell } from "@/components/ui/Modal";
import { ScanScreen } from "@/components/screens/ScanScreen";
import { inr, inrK } from "@/lib/format";

type VBooking = { id: string; who: string; turf: string; unit: string; field: string; dateLabel: string; time: string; price: number; status: string; checkedIn: boolean; isToday: boolean; players?: string; rescheduledAt?: string | null; prevDateLabel?: string | null; prevTime?: string | null };
type VTurf = { id: string; name: string; area: string; unit: string };

const cell: React.CSSProperties = { padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)", textAlign: "left" };
const th: React.CSSProperties = { ...cell, fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--color-mute)" };

function statusBadge(b: VBooking) {
  if (b.checkedIn) return <Badge variant="positive">Checked in</Badge>;
  if (b.status === "cancelled") return <Badge variant="negative">Cancelled</Badge>;
  if (b.status === "completed") return <Badge variant="neutral">Completed</Badge>;
  return <Badge variant="ink">Upcoming</Badge>;
}

export function VendorScreen({ meName, turfs, bookings, kpis }: { meName: string; turfs: VTurf[]; bookings: VBooking[]; kpis: { today: number; upcoming: number; revenue: number; checkedIn: number } }) {
  const [view, setView] = useState<"bookings" | "scan">("bookings");
  const [filter, setFilter] = useState("today");
  const [detail, setDetail] = useState<VBooking | null>(null);
  const tabs: [string, string][] = [["today", "Today"], ["upcoming", "Upcoming"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All"]];
  const shown = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "today") return b.isToday && b.status !== "cancelled";
    return b.status === filter;
  });

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 28, paddingBottom: 64 }}>
      <Container wide>
        <Eyebrow style={{ marginBottom: 4 }}>Turfie Onboard</Eyebrow>
        <Display size={34} style={{ marginBottom: 4 }}>Vendor dashboard</Display>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: "0 0 20px" }}>
          Welcome back, {meName}. {turfs.length ? `Managing ${turfs.length} turf${turfs.length > 1 ? "s" : ""}.` : "No turfs assigned yet."}
        </p>

        {/* primary view tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          <Chip selected={view === "bookings"} onClick={() => setView("bookings")}>Bookings</Chip>
          <Chip selected={view === "scan"} onClick={() => setView("scan")}>Check-in scanner</Chip>
        </div>

        {view === "scan" ? (
          <Suspense fallback={null}><ScanScreen embedded /></Suspense>
        ) : turfs.length === 0 ? (
          <Card tone="white" style={{ padding: 32, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Icon name="compass" size={30} color="var(--color-ink-deep)" /></div>
            <Display size={22} style={{ marginBottom: 6 }}>No turfs assigned</Display>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: 0 }}>The Turfie team will assign your turf(s) to this account. You can still use the Check-in scanner at the gate.</p>
          </Card>
        ) : (
          <>
            <div className="t-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[["Today's games", String(kpis.today), "calendar"], ["Upcoming", String(kpis.upcoming), "clock"], ["Revenue", inrK(kpis.revenue), "wallet"], ["Checked in", String(kpis.checkedIn), "check"]].map(([l, v, ic]) => (
                <Card key={l} tone="white" style={{ padding: 20 }}>
                  <Icon name={ic} size={20} color="var(--color-ink-deep)" />
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginTop: 10 }}>{v}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>{l}</div>
                </Card>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {turfs.map((t) => <Chip key={t.id}>{t.name}</Chip>)}
            </div>

            <div className="t-scroll-x" style={{ display: "flex", gap: 10, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
              {tabs.map(([id, label]) => <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</Chip>)}
            </div>

            <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                  <thead><tr>{["Booking", "Player", "Turf", "When", "Court", "Amount", "Status"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {shown.length === 0 && <tr><td style={{ ...cell, color: "var(--color-mute)" }} colSpan={7}>No bookings here.</td></tr>}
                    {shown.map((b) => (
                      <tr key={b.id} onClick={() => setDetail(b)} style={{ borderTop: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                        <td style={{ ...cell, fontWeight: 700, color: "var(--color-ink)" }}>{b.id}{b.rescheduledAt && <Icon name="refresh" size={13} color="var(--color-warning-deep)" style={{ marginLeft: 6, verticalAlign: "middle" }} />}</td>
                        <td style={cell}>{b.who}</td>
                        <td style={cell}>{b.turf}</td>
                        <td style={cell}>{b.dateLabel} · {b.time}</td>
                        <td style={cell}>{b.unit} {b.field}</td>
                        <td style={cell}>{inr(b.price)}</td>
                        <td style={cell}>{statusBadge(b)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {detail && (
          <ModalShell onClose={() => setDetail(null)} maxWidth={460}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-mute)" }}>Booking</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{detail.id}</div>
              </div>
              {statusBadge(detail)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Player", detail.who], ["Turf", detail.turf], ["Date", detail.dateLabel], ["Time", detail.time], [detail.unit, `${detail.unit} ${detail.field}`], ["Players", detail.players || "—"], ["Amount", inr(detail.price)], ["Checked in", detail.checkedIn ? "Yes" : "No"]].map(([l, v]) => (
                <div key={l}><div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--color-mute)" }}>{l}</div><div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>{v}</div></div>
              ))}
            </div>
            {detail.rescheduledAt && detail.prevDateLabel && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 13px", marginTop: 16, background: "var(--color-warning-pale)", borderRadius: "var(--radius-md)" }}>
                <Icon name="refresh" size={16} color="var(--color-warning-deep)" />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-warning-content)", lineHeight: 1.45 }}>
                  Rescheduled {detail.rescheduledAt} · moved from <strong>{detail.prevDateLabel} · {detail.prevTime}</strong> to <strong>{detail.dateLabel} · {detail.time}</strong>.
                </span>
              </div>
            )}
          </ModalShell>
        )}
      </Container>
    </div>
  );
}
