"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { inr, inrK } from "@/lib/format";

type VBooking = { id: string; who: string; turf: string; unit: string; field: string; dateLabel: string; time: string; price: number; status: string; checkedIn: boolean; isToday: boolean };
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
  const router = useRouter();
  const [filter, setFilter] = useState("today");
  const tabs: [string, string][] = [["today", "Today"], ["upcoming", "Upcoming"], ["all", "All"]];
  const shown = bookings.filter((b) => filter === "all" || (filter === "today" ? b.isToday && b.status !== "cancelled" : b.status === "upcoming"));

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 28, paddingBottom: 64 }}>
      <Container wide>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
          <Eyebrow>Turfie Onboard</Eyebrow>
          <Button size="sm" variant="primary" onClick={() => router.push("/scan")} iconLeft={<Icon name="navigation" size={15} />}>Scan entry pass</Button>
        </div>
        <Display size={34} style={{ marginBottom: 4 }}>Vendor dashboard</Display>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: "0 0 22px" }}>
          Welcome back, {meName}. {turfs.length ? `Managing ${turfs.length} turf${turfs.length > 1 ? "s" : ""}.` : "No turfs assigned yet."}
        </p>

        {turfs.length === 0 ? (
          <Card tone="white" style={{ padding: 32, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Icon name="compass" size={30} color="var(--color-ink-deep)" /></div>
            <Display size={22} style={{ marginBottom: 6 }}>No turfs assigned</Display>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: 0 }}>The Turfie team will assign your turf(s) to this account. Once linked, your bookings show up here.</p>
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
                      <tr key={b.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td style={{ ...cell, fontWeight: 700, color: "var(--color-ink)" }}>{b.id}</td>
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
      </Container>
    </div>
  );
}
