import React from "react";
import { Icon, SportGlyph } from "./Icon";
import { AVATARS, SPORT_TINT } from "@/lib/content";

type CSS = React.CSSProperties;

export function Container({ children, wide = false, style = {} }: { children: React.ReactNode; wide?: boolean; style?: CSS }) {
  return (
    <div className="t-container" style={{ width: "100%", maxWidth: wide ? 1280 : 1180, margin: "0 auto", padding: "0 24px", boxSizing: "border-box", ...style }}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, color = "var(--color-mute)", style = {} }: { children: React.ReactNode; color?: string; style?: CSS }) {
  return (
    <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color, ...style }}>
      {children}
    </div>
  );
}

export function Display({
  children, size = 56, as = "h2", style = {},
}: { children: React.ReactNode; size?: number; as?: "h1" | "h2" | "h3" | "h4"; style?: CSS }) {
  const Tag = as as keyof React.JSX.IntrinsicElements;
  return (
    <Tag
      className="t-display"
      style={{
        // @ts-expect-error CSS custom property
        "--disp": size + "px",
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--disp)",
        lineHeight: 1.22, letterSpacing: "-.02em", textTransform: "uppercase", margin: 0,
        paddingBottom: "0.06em", overflowWrap: "break-word", ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function Stars({ rating = 5, size = 14, showNum = true }: { rating?: number; size?: number; showNum?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-warning)" }}>
      <Icon name="star" size={size} />
      {showNum && <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: size, color: "var(--color-ink)" }}>{rating.toFixed(1)}</span>}
    </span>
  );
}

export function Avatar({ initials = "AS", size = 40, ring = false, style = {} }: { initials?: string; size?: number; ring?: boolean; style?: CSS }) {
  const a = (AVATARS && AVATARS[initials]) || { c: "#c5edab", t: "#163300" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: a.c, color: a.t,
      display: "grid", placeItems: "center", flexShrink: 0,
      fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size * 0.38,
      border: ring ? "2px solid var(--color-canvas)" : "none",
      boxShadow: ring ? "0 0 0 1px rgba(14,15,12,.08)" : "none", ...style,
    }}>
      {initials}
    </div>
  );
}

export function AvatarStack({ people = ["RS", "AK", "MJ"], extra = 0, size = 30 }: { people?: string[]; extra?: number; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {people.map((p, i) => (
        <div key={p + i} style={{ marginLeft: i === 0 ? 0 : -size * 0.34, zIndex: people.length - i }}>
          <Avatar initials={p} size={size} ring />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -size * 0.34, height: size, minWidth: size, padding: "0 " + Math.round(size * 0.28) + "px",
          boxSizing: "border-box", borderRadius: size, background: "var(--color-ink)", color: "var(--color-primary)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap",
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: size * 0.34, lineHeight: 1, border: "2px solid var(--color-canvas)",
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

/** Illustrated court header — flat colored field + white pitch lines + sport glyph. */
export function CourtArt({
  sport = "football", tint, height = 200, radius = 0, badge = null, children, style = {},
}: { sport?: string; tint?: string; height?: number | string; radius?: number; badge?: React.ReactNode; children?: React.ReactNode; style?: CSS }) {
  const t = tint || (SPORT_TINT && SPORT_TINT[sport]) || "#c5edab";
  return (
    <div style={{ position: "relative", height, width: "100%", overflow: "hidden", background: t, borderRadius: radius, ...style }}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
        <g stroke="rgba(14,15,12,.32)" strokeWidth="2.5" fill="none">
          <rect x="48" y="20" width="304" height="200" rx="4" />
          <line x1="200" y1="20" x2="200" y2="220" />
          <circle cx="200" cy="120" r="34" />
          <line x1="48" y1="72" x2="120" y2="72" /><line x1="120" y1="72" x2="120" y2="168" /><line x1="48" y1="168" x2="120" y2="168" />
          <line x1="352" y1="72" x2="280" y2="72" /><line x1="280" y1="72" x2="280" y2="168" /><line x1="352" y1="168" x2="280" y2="168" />
        </g>
      </svg>
      <div style={{ position: "absolute", right: -10, bottom: -16, opacity: 0.9, transform: "rotate(-12deg)" }}>
        <SportGlyph sport={sport} size={130} color="rgba(14,15,12,.20)" stroke={2.4} />
      </div>
      {badge && <div style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}>{badge}</div>}
      {children}
    </div>
  );
}

/** Responsive section header — title + optional meta that STACKS on mobile. */
export function SectionHead({ title, meta, size = 20, style = {} }: { title: React.ReactNode; meta?: React.ReactNode; size?: number; style?: CSS }) {
  return (
    <div className="t-sechead" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 16, ...style }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size, textTransform: "uppercase", margin: 0, lineHeight: 1.15 }}>{title}</h3>
      {meta != null && <div className="t-sechead-meta" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)" }}>{meta}</div>}
    </div>
  );
}
