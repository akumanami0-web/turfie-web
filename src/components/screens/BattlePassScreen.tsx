"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { QrCode } from "@/components/ui/QrCode";
import { fmtDateShort } from "@/lib/format";

type Battle = { id: string; title: string; sport: string; format: string; subs: number; area: string | null; address: string | null; dateLabel: string; time: string; status: string; prizePool: string | null };

export function BattlePassScreen({ battle: t, playerName, checkedInAt, token }: { battle: Battle; playerName: string; checkedInAt: number | null; token: string }) {
  const router = useRouter();
  const qrValue = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/scan?t=${encodeURIComponent(token)}`;
  }, [token]);
  const checkedIn = !!checkedInAt;
  const where = t.area || t.address || "TBA";

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 24, paddingBottom: 64 }}>
      <Container style={{ maxWidth: 460 }}>
        <button onClick={() => router.push("/battles")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--color-body)", padding: "4px 0", marginBottom: 14 }}>
          <Icon name="arrowLeft" size={18} /> Battles
        </button>

        <Card tone="white" padding={0} style={{ overflow: "hidden" }}>
          <div style={{ position: "relative" }}>
            <CourtArt sport={t.sport} height={120} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,15,12,0) 40%, rgba(14,15,12,.45) 100%)" }} />
            <div style={{ position: "absolute", left: 20, bottom: 14, right: 20 }}>
              <Eyebrow color="var(--color-primary)" style={{ marginBottom: 2 }}>Battle pass</Eyebrow>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#fff", lineHeight: 1.1 }}>{t.title}</div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              {[["Date", t.dateLabel], ["Time", t.time], ["Format", `${t.format}${t.subs > 0 ? ` · ${t.subs} subs` : ""}`], ["Venue", where], ["Player", playerName], ["Prize", t.prizePool || "—"]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-mute)" }}>{l}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ position: "relative", height: 24, margin: "4px -24px 8px" }}>
              <div style={{ position: "absolute", top: "50%", left: 16, right: 16, borderTop: "2px dashed var(--border-subtle)" }} />
              <div style={{ position: "absolute", top: "50%", left: -12, transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "var(--color-canvas-soft)" }} />
              <div style={{ position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "var(--color-canvas-soft)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {checkedIn ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                    <Icon name="checkCircle" size={34} color="var(--color-positive)" />
                  </div>
                  <Display size={20} style={{ marginBottom: 4 }}>Checked in</Display>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", margin: 0 }}>Entry confirmed on {fmtDateShort(new Date(checkedInAt!))}.</p>
                </div>
              ) : t.status === "completed" ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <Badge variant="neutral">Completed</Badge>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", margin: "10px 0 0" }}>This battle has ended.</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: 12, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
                    <QrCode value={qrValue} size={210} />
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", textAlign: "center", margin: 0 }}>
                    Show this QR at the venue to check in for the battle.
                  </p>
                </>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 26, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.svg" alt="Turfie" height={26} style={{ display: "block" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-mute)" }}>by Edinguy</span>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
