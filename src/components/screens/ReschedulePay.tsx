"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/providers/toast";
import { inr } from "@/lib/format";

export function ReschedulePay({ id, ok, turfName, fromLabel, toLabel, fee }: {
  id: string; ok: boolean; turfName: string; fromLabel: string; toLabel: string; fee: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function pay() {
    setBusy(true);
    // Demo PSP — in production this is a Razorpay payment link; on success the
    // gateway redirects back here and we confirm.
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(`/api/bookings/${id}/reschedule-pay`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't confirm. Try again.", "error"); return; }
    setDone(true);
    toast("Paid — your booking has been moved!");
  }

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <Container style={{ maxWidth: 440 }}>
        <Card tone="white" style={{ padding: 28 }}>
          {!ok ? (
            <div style={{ textAlign: "center" }}>
              <Icon name="x" size={40} color="var(--color-mute)" style={{ margin: "0 auto 14px" }} />
              <Display size={22} style={{ marginBottom: 8 }}>Nothing to pay</Display>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)" }}>This reschedule link has expired or was already completed.</p>
            </div>
          ) : done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Icon name="check" size={32} color="var(--color-positive)" stroke={2.6} />
              </div>
              <Display size={24} style={{ marginBottom: 8 }}>You&apos;re all set!</Display>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", marginBottom: 18 }}>{turfName} is now booked for <strong>{toLabel}</strong>.</p>
              <Button fullWidth onClick={() => router.push("/account/bookings")}>View my bookings</Button>
            </div>
          ) : (
            <>
              <Eyebrow style={{ marginBottom: 6 }}>Confirm reschedule</Eyebrow>
              <Display size={24} style={{ marginBottom: 14 }}>{turfName}</Display>
              <div style={{ background: "var(--color-canvas-soft)", borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-body)", fontSize: 14 }}>
                  <span style={{ color: "var(--color-mute)", textDecoration: "line-through" }}>{fromLabel}</span>
                  <Icon name="arrowRight" size={15} color="var(--color-mute)" />
                  <span style={{ fontWeight: 700, color: "var(--color-ink)" }}>{toLabel}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)" }}>Reschedule fee</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>{inr(fee)}</span>
              </div>
              <Button fullWidth size="lg" disabled={busy} onClick={pay} iconRight={!busy ? <Icon name="arrowRight" size={18} /> : undefined}>
                {busy ? "Processing…" : `Pay ${inr(fee)} & move booking`}
              </Button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>
                <Icon name="shield" size={14} color="var(--color-positive)" /> Secured payment
              </div>
            </>
          )}
        </Card>
      </Container>
    </div>
  );
}
