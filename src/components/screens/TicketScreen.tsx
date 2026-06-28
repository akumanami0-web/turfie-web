"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { QrCode } from "@/components/ui/QrCode";
import { useToast } from "@/components/providers/toast";
import { fmtDateShort } from "@/lib/format";
import type { Booking } from "@/lib/types";

export function TicketScreen({ booking: b, turfName, area, token }: { booking: Booking; turfName: string; area: string; token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busyWallet, setBusyWallet] = useState<"google" | "apple" | null>(null);

  // The QR opens the vendor scan page with this signed token.
  const qrValue = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/scan?t=${encodeURIComponent(token)}`;
  }, [token]);

  const checkedIn = !!b.checkedInAt;

  async function addToWallet(platform: "google" | "apple") {
    setBusyWallet(platform);
    try {
      const res = await fetch(`/api/tickets/${b.id}/wallet?platform=${platform}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast(data.error || "Couldn't add to wallet", "warning"); return; }
      if (data.url) window.location.href = data.url;
    } finally {
      setBusyWallet(null);
    }
  }

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 24, paddingBottom: 64 }}>
      <Container style={{ maxWidth: 460 }}>
        <button onClick={() => router.push("/account/bookings")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--color-body)", padding: "4px 0", marginBottom: 14 }}>
          <Icon name="arrowLeft" size={18} /> My bookings
        </button>

        <Card tone="white" padding={0} style={{ overflow: "hidden" }}>
          {/* header */}
          <div style={{ position: "relative" }}>
            <CourtArt sport={b.sport} height={120} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,15,12,0) 40%, rgba(14,15,12,.45) 100%)" }} />
            <div style={{ position: "absolute", left: 20, bottom: 14, right: 20 }}>
              <Eyebrow color="var(--color-primary)" style={{ marginBottom: 2 }}>Entry pass</Eyebrow>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#fff", lineHeight: 1.1 }}>{turfName}</div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              {[["Date", b.dateLabel], ["Time", b.time], [b.unit, `${b.unit} ${b.field}`], ["Booking", b.id]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-mute)" }}>{l}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* perforation */}
            <div style={{ position: "relative", height: 24, margin: "4px -24px 8px" }}>
              <div style={{ position: "absolute", top: "50%", left: 16, right: 16, borderTop: "2px dashed var(--border-subtle)" }} />
              <div style={{ position: "absolute", top: "50%", left: -12, transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "var(--color-canvas-soft)" }} />
              <div style={{ position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "var(--color-canvas-soft)" }} />
            </div>

            {/* QR */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {checkedIn ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                    <Icon name="checkCircle" size={34} color="var(--color-positive)" />
                  </div>
                  <Display size={20} style={{ marginBottom: 4 }}>Checked in</Display>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", margin: 0 }}>Entry confirmed on {fmtDateShort(new Date(b.checkedInAt!))}.</p>
                </div>
              ) : b.status === "cancelled" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Badge variant="negative">Cancelled</Badge>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", margin: "10px 0 0" }}>This booking was cancelled and can&apos;t be used for entry.</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: 12, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
                    <QrCode value={qrValue} size={210} />
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", textAlign: "center", margin: 0 }}>
                    Show this QR at the venue gate to check in.
                  </p>
                </>
              )}
            </div>

            {/* wallet */}
            {!checkedIn && b.status !== "cancelled" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                <Button variant="tertiary" fullWidth disabled={busyWallet !== null} onClick={() => addToWallet("google")} iconLeft={<Icon name="wallet" size={17} />}>
                  {busyWallet === "google" ? "Opening…" : "Add to Google Wallet"}
                </Button>
                <Button variant="tertiary" fullWidth disabled={busyWallet !== null} onClick={() => addToWallet("apple")} iconLeft={<Icon name="wallet" size={17} />}>
                  {busyWallet === "apple" ? "Opening…" : "Add to Apple Wallet"}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
}
