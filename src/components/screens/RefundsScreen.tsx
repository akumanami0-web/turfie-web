"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { inr, fmtDateShort } from "@/lib/format";
import type { Booking, Turf } from "@/lib/types";

const REFUND_STAGES = [
  { id: "pending", label: "Requested", icon: "clock", blurb: "Cancellation received. Refund queued for processing." },
  { id: "processing", label: "In process", icon: "refresh", blurb: "We’re verifying the booking and preparing your refund." },
  { id: "initiated", label: "Initiated", icon: "wallet", blurb: "Refund sent to your bank / wallet. Awaiting their confirmation." },
  { id: "success", label: "Completed", icon: "checkCircle", blurb: "Refund credited. Enjoy your next game on us." },
];
const STAGE_INDEX: Record<string, number> = { pending: 0, processing: 1, initiated: 2, success: 3 };
const STAGE_TONE: Record<string, "warning" | "neutral" | "positive"> = { pending: "warning", processing: "warning", initiated: "neutral", success: "positive" };
const DAY = 86400000;

function addWorkingDays(ts: number, n: number) {
  const d = new Date(ts); let added = 0;
  while (added < n) { d.setDate(d.getDate() + 1); const dow = d.getDay(); if (dow !== 0 && dow !== 6) added++; }
  return d;
}
function refundStage(cancelledAt: number | null | undefined) {
  const el = Date.now() - (cancelledAt || Date.now());
  if (el >= 5 * DAY) return "success";
  if (el >= 2 * DAY) return "initiated";
  if (el >= 0.5 * DAY) return "processing";
  return "pending";
}

function StageTracker({ stage }: { stage: string }) {
  const cur = STAGE_INDEX[stage];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginTop: 4 }}>
      {REFUND_STAGES.map((s, i) => {
        const done = i < cur, active = i === cur, on = done || active;
        return (
          <div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", minWidth: 0 }}>
            {i > 0 && <div style={{ position: "absolute", top: 22, right: "50%", width: "100%", height: 3, background: i <= cur ? "var(--color-primary)" : "var(--border-subtle)", zIndex: 0 }} />}
            <div style={{ position: "relative", zIndex: 1, width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", background: done ? "var(--color-primary)" : active ? "var(--color-ink)" : "var(--color-canvas)", border: on ? "none" : "2px solid var(--border-subtle)" }}>
              <Icon name={done ? "check" : s.icon} size={20} color={done ? "var(--color-ink)" : active ? "var(--color-primary)" : "var(--color-mute)"} stroke={2.4} />
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: on ? 700 : 600, fontSize: 12.5, color: on ? "var(--color-ink)" : "var(--color-mute)", marginTop: 8, textAlign: "center", lineHeight: 1.2 }}>{s.label}</div>
            {active && <div className="t-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-warning-deep)", marginTop: 4 }} />}
          </div>
        );
      })}
    </div>
  );
}

function RefundCard({ b, turf, onHelp, onRebook }: { b: Booking; turf: Turf; onHelp: () => void; onRebook: () => void }) {
  const stage = refundStage(b.cancelledAt);
  const cur = REFUND_STAGES[STAGE_INDEX[stage]];
  const eta = addWorkingDays(b.cancelledAt || Date.now(), 5);
  const amount = b.refundAmount != null ? b.refundAmount : b.price;
  const pct = b.refundPct != null ? b.refundPct : 100;
  return (
    <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 22px", display: "flex", gap: 14, alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0 }}><CourtArt sport={b.sport} height={52} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>{turf.name}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", marginTop: 3 }}>{b.id} · {b.dateLabel} · {b.time}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>{inr(amount)}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--color-mute)", marginTop: 1 }}>{pct === 100 ? "Full refund" : pct === 50 ? "50% refund" : "No refund"}{pct > 0 && pct < 100 ? ` of ${inr(b.price)}` : ""}</div>
          <Badge variant={STAGE_TONE[stage]} style={{ marginTop: 4, fontSize: 11.5 }}>{cur.label}</Badge>
        </div>
      </div>
      <div style={{ padding: "22px 22px 20px" }}>
        <StageTracker stage={stage} />
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 22, padding: "14px 16px", background: stage === "success" ? "var(--color-primary-pale)" : "var(--color-canvas-soft)", borderRadius: "var(--radius-lg)" }}>
          <Icon name={cur.icon} size={18} color="var(--color-ink-deep)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--color-ink)" }}>{cur.blurb}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", marginTop: 3 }}>
              {stage === "success" ? `Refunded to ${b.refundMethod || "Turfie wallet"}.` : `Refund to ${b.refundMethod || "Turfie wallet"} · expected by ${fmtDateShort(eta)} (3–5 working days).`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>Refund ID: RF-{b.id.replace("TRF-", "")}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm" variant="ghost" onClick={onHelp}>Need help?</Button>
            <Button size="sm" variant="tertiary" onClick={onRebook}>Rebook</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function RefundsScreen({ bookings, turfs }: { bookings: Booking[]; turfs: Turf[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const turfMap = new Map(turfs.map((t) => [t.id, t]));
  const refunds = bookings.filter((b) => b.status === "cancelled");
  const withStage = refunds.map((b) => ({ b, stage: refundStage(b.cancelledAt) }));
  const tabs: [string, string][] = [["all", "All"], ["active", "In progress"], ["success", "Completed"]];
  const list = withStage.filter(({ stage }) => filter === "all" || (filter === "success" ? stage === "success" : stage !== "success"));
  const amt = (b: Booking) => (b.refundAmount != null ? b.refundAmount : b.price);
  const totalActive = withStage.filter(({ stage }) => stage !== "success").reduce((s, { b }) => s + amt(b), 0);
  const totalDone = withStage.filter(({ stage }) => stage === "success").reduce((s, { b }) => s + amt(b), 0);

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <button onClick={() => router.push("/account")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--color-body)", padding: "4px 0", marginBottom: 12 }}>
          <Icon name="arrowLeft" size={18} /> Account
        </button>
        <Eyebrow style={{ marginBottom: 8 }}>Refunds</Eyebrow>
        <Display size={38} style={{ marginBottom: 6 }}>Track your refunds</Display>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-body)", margin: "0 0 24px", maxWidth: 560 }}>
          Cancelled a booking? Refunds are initiated automatically and reach your account within 3–5 working days.
        </p>

        {refunds.length > 0 && (
          <div className="t-refund-summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <Card tone="dark" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}><Icon name="refresh" size={18} color="var(--color-primary)" /><span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em" }}>In progress</span></div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: "#fff", marginTop: 12 }}>{inr(totalActive)}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{withStage.filter(({ stage }) => stage !== "success").length} refund{withStage.filter(({ stage }) => stage !== "success").length === 1 ? "" : "s"} on the way</div>
            </Card>
            <Card tone="pale" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-ink-deep)" }}><Icon name="checkCircle" size={18} color="var(--color-positive)" /><span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: ".06em" }}>Completed</span></div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, marginTop: 12 }}>{inr(totalDone)}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-body)", marginTop: 2 }}>refunded to date</div>
            </Card>
          </div>
        )}

        {refunds.length > 0 && (
          <div className="t-scroll-x" style={{ display: "flex", gap: 10, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
            {tabs.map(([id, label]) => <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</Chip>)}
          </div>
        )}

        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Icon name="refresh" size={32} color="var(--color-ink-deep)" />
            </div>
            <Display size={24} style={{ marginBottom: 8 }}>No refunds {filter !== "all" ? "here" : "yet"}</Display>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, color: "var(--color-body)", margin: "0 0 20px" }}>When you cancel a booking, its refund will show up here so you can track every step.</p>
            <Button onClick={() => router.push("/account/bookings")}>View my bookings</Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {list.map(({ b }) => {
              const turf = turfMap.get(b.turfId);
              if (!turf) return null;
              return <RefundCard key={b.id} b={b} turf={turf} onHelp={() => router.push("/contact")} onRebook={() => router.push(`/turf/${b.turfId}`)} />;
            })}
          </div>
        )}

        <Card tone="sage" style={{ padding: 22, marginTop: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Icon name="shield" size={20} color="var(--color-ink-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>How refunds work</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.55, color: "var(--color-body)", margin: 0 }}>
              Cancel more than 24 hours before kick-off for a full refund. Between 24 and 4 hours before, you receive 50%. Less than 4 hours before kick-off the booking is non-refundable. Approved refunds go to your Turfie wallet or original payment method within 3–5 working days.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
