"use client";
import React from "react";

export type Glyph = "sun" | "cloud" | "rain" | "storm" | "fog";

/** Animated falling-rain overlay. `count` droplets, absolutely positioned over
    the parent (parent must be position:relative + overflow:hidden). */
export function RainOverlay({ count = 14, color }: { count?: number; color?: string }) {
  // Deterministic per-index placement so SSR + client markup match.
  const drops = Array.from({ length: count }, (_, i) => {
    const left = ((i * 37) % 100) + (i % 3); // spread across width
    const dur = 0.7 + ((i * 13) % 7) / 10;   // 0.7–1.3s
    const delay = ((i * 29) % 13) / 10;       // 0–1.2s
    const h = 9 + ((i * 7) % 7);              // 9–15px
    return { left, dur, delay, h };
  });
  return (
    <span className="t-rain" aria-hidden>
      {drops.map((d, i) => (
        <i key={i} style={{ left: `${d.left}%`, height: d.h, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s`, ...(color ? { background: `linear-gradient(to bottom, transparent, ${color})` } : {}) }} />
      ))}
    </span>
  );
}

/** Small brand-coloured weather glyph. */
export function WeatherGlyph({ glyph, size = 44 }: { glyph: Glyph; size?: number }) {
  const s = size;
  if (glyph === "sun") {
    return (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <g className="t-wx-sun">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="24" y1="3" x2="24" y2="9" stroke="var(--color-warning-deep)" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${i * 45} 24 24)`} />
          ))}
        </g>
        <circle cx="24" cy="24" r="9" fill="var(--color-warning)" stroke="var(--color-ink)" strokeWidth="2" />
      </svg>
    );
  }
  if (glyph === "rain" || glyph === "storm") {
    return (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <g className="t-wx-float">
          <path d="M14 26a8 8 0 0 1 .6-15.9A11 11 0 0 1 36 14a7 7 0 0 1-1 14H14z" fill="var(--color-canvas-soft)" stroke="var(--color-ink)" strokeWidth="2" />
        </g>
        {glyph === "storm" ? (
          <path d="M24 30l-4 7h5l-3 7 8-10h-5l3-4z" fill="var(--color-warning)" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinejoin="round" />
        ) : (
          [16, 24, 32].map((x, i) => (
            <line key={i} x1={x} y1="32" x2={x - 3} y2="40" stroke="#38c8ff" strokeWidth="2.5" strokeLinecap="round" />
          ))
        )}
      </svg>
    );
  }
  if (glyph === "fog") {
    return (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        {[18, 24, 30, 36].map((y, i) => <line key={i} x1="9" y1={y} x2="39" y2={y} stroke="var(--color-mute)" strokeWidth="2.5" strokeLinecap="round" opacity={0.5 + i * 0.12} />)}
      </svg>
    );
  }
  // cloud
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      <g className="t-wx-float">
        <path d="M14 32a8 8 0 0 1 .6-15.9A11 11 0 0 1 36 20a7 7 0 0 1-1 14H14z" fill="var(--color-canvas-soft)" stroke="var(--color-ink)" strokeWidth="2" />
      </g>
    </svg>
  );
}
