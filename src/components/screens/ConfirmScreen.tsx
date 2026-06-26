"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui/primitives";
import { Container, Display, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { confettiOnce } from "@/lib/confetti";
import { inr } from "@/lib/format";
import type { Booking, Turf } from "@/lib/types";

export function ConfirmScreen({ turfs }: { turfs: Turf[] }) {
  const router = useRouter();
  const [b, setB] = useState<Booking | null>(null);

  useEffect(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem("turfie.lastBooking") || "null");
      if (v) setB(v);
    } catch {}
    confettiOnce();
  }, []);

  if (!b) {
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <Button onClick={() => router.push("/browse")}>Browse turfs</Button>
      </div>
    );
  }
  const t = turfs.find((x) => x.id === b.turfId);
  if (!t) return null;

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 40, paddingBottom: 64 }}>
      <Container style={{ maxWidth: 640 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 78, height: 78, borderRadius: "50%", background: "var(--color-primary)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <Icon name="check" size={40} color="var(--color-ink)" stroke={2.6} />
          </div>
          <Display size={40} style={{ marginBottom: 10 }}>You&apos;re booked in!</Display>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--color-body)", margin: 0 }}>
            Confirmation sent to {(b.contactEmail || b.contactPhone) || "your contact"}. See you on the turf.
          </p>
        </div>

        <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
          <CourtArt sport={t.primary} height={140}>
            <div style={{ position: "absolute", left: 20, bottom: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "var(--color-ink)" }}>{t.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-ink-deep)" }}>{t.area}{b.unit ? ` · ${b.unit} ${b.field}` : ""} · {b.duration}</div>
            </div>
          </CourtArt>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>Booking ID</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: ".04em" }}>{b.id}</span>
            </div>
            <div className="t-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
              {([["calendar", "Date", b.dateLabel], ["clock", "Time", b.time], ["compass", "Paid", inr(b.price)]] as const).map(([icon, l, v]) => (
                <div key={l} style={{ background: "var(--color-canvas-soft)", borderRadius: "var(--radius-lg)", padding: "14px 14px" }}>
                  <Icon name={icon} size={18} color="var(--color-mute)" />
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--color-mute)", marginTop: 8 }}>{l}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="t-2btn" style={{ display: "flex", gap: 12 }}>
              <Button variant="tertiary" fullWidth onClick={() => router.push("/account/bookings")}>My bookings</Button>
              <Button fullWidth onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={18} />}>Book another</Button>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
