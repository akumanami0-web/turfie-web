"use client";
import React, { useEffect, useState } from "react";
import { Container } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { RainOverlay, WeatherGlyph, type Glyph } from "@/components/ui/Weather";

type Now = { tempC: number; label: string; rain: boolean; glyph: Glyph };

export function WeatherBanner() {
  const [now, setNow] = useState<Now | null>(null);

  useEffect(() => {
    let off = false;
    fetch("/api/weather").then((r) => r.json()).then((d) => { if (!off && d.ok) setNow(d.forecast.now); }).catch(() => {});
    return () => { off = true; };
  }, []);

  if (!now) return null;
  const wet = now.glyph === "rain" || now.glyph === "storm";

  const headline = wet ? "Rain on the radar" : now.glyph === "sun" ? "It's the weather to play!" : "Good conditions to play";
  const body = wet
    ? "If you've already booked, you can reschedule anytime — and we'll always ping you on WhatsApp before rain so you can move your game."
    : "Clear skies over Mumbai right now. Grab your squad and get on the pitch.";

  // Brand-kit theming: green/sage for good weather, cool sky-blue ink for rain.
  const bg = wet ? "var(--color-ink)" : "var(--color-primary-pale)";
  const fg = wet ? "#fff" : "var(--color-ink)";
  const sub = wet ? "rgba(255,255,255,.8)" : "var(--color-body)";

  return (
    <section style={{ background: "var(--color-canvas)", padding: "0 0 8px" }}>
      <Container>
        <div style={{ position: "relative", overflow: "hidden", background: bg, borderRadius: "var(--radius-xl)", padding: "22px 26px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", border: wet ? "none" : "1px solid var(--color-ink)" }}>
          {wet && <RainOverlay count={20} />}
          <div style={{ position: "relative", zIndex: 1, width: 64, height: 64, borderRadius: "var(--radius-lg)", background: wet ? "rgba(255,255,255,.08)" : "var(--color-canvas)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <WeatherGlyph glyph={now.glyph} size={42} />
          </div>
          <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, color: fg }}>{headline}</span>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: sub }}>{now.tempC}°C · {now.label}</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: sub, margin: "5px 0 0", maxWidth: 620 }}>{body}</p>
          </div>
          {wet && (
            <div style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: "var(--radius-pill)", background: "var(--color-primary)", color: "var(--color-ink-deep)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>
              <Icon name="refresh" size={15} color="var(--color-ink-deep)" /> Free reschedule
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
