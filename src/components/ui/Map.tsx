"use client";
import React from "react";
import { Icon } from "./Icon";
import { inr } from "@/lib/format";
import { dirUrl, mapEmbedSrc } from "@/lib/maps";
import { MAP_CENTER } from "@/lib/content";
import type { Turf } from "@/lib/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || undefined;

/** Real (key-less by default) Google Maps embed with a Directions button. */
export function GoogleMap({
  turf, query, label, height = 280, zoom = 15, showDirections = true,
}: { turf?: Turf | null; query?: string; label?: string; height?: number; zoom?: number; showDirections?: boolean }) {
  const q = query || (turf && turf.lat && turf.lng ? `${turf.lat},${turf.lng}` : (turf && turf.name + " " + turf.area) || "Nalasopara");
  const src = mapEmbedSrc(q, zoom, MAPS_KEY);
  const directionsHref = turf ? dirUrl(turf) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  return (
    <div style={{ position: "relative", width: "100%", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
      <iframe title={`Map — ${label || (turf && turf.name) || "location"}`} src={src} width="100%" height={height} style={{ border: 0, display: "block", width: "100%" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      {showDirections && (
        <a href={directionsHref} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", right: 12, bottom: 12, display: "inline-flex", alignItems: "center", gap: 7, background: "var(--color-ink)", color: "var(--color-primary)", textDecoration: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, padding: "9px 14px", borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-pop)" }}>
          <Icon name="navigation" size={15} color="var(--color-primary)" /> Directions
        </a>
      )}
    </div>
  );
}

/** Branded SVG map with price pins — used as the Browse overview stand-in. */
export function MapView({
  turfs, activeId, onPick, height = 460, center,
}: { turfs: Turf[]; activeId?: string | null; onPick?: (t: Turf) => void; height?: number; center?: { lat: number; lng: number } }) {
  const c = center || MAP_CENTER;
  const span = 0.085;
  const proj = (t: Turf) => ({ x: 0.5 + (t.lng - c.lng) / span, y: 0.5 - (t.lat - c.lat) / span });
  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "var(--radius-xl)", overflow: "hidden", background: "#dfe6dd", border: "1px solid var(--border-subtle)" }}>
      <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <rect width="600" height="460" fill="#e4eadf" />
        <path d="M-20 360 Q150 330 300 360 T620 350 V480 H-20 Z" fill="#cfe0c4" opacity="0.7" />
        <rect x="380" y="-20" width="120" height="200" rx="20" fill="#bfe0ea" opacity="0.6" />
        <path d="M60 40 Q120 60 90 140" fill="#cfe0c4" opacity="0.55" />
        <g stroke="#ffffff" strokeWidth="9" fill="none" opacity="0.9" strokeLinecap="round">
          <path d="M-20 150 H620" /><path d="M-20 280 H620" /><path d="M160 -20 V480" /><path d="M420 -20 V480" />
        </g>
        <g stroke="#eef2ec" strokeWidth="4" fill="none" opacity="0.9">
          <path d="M-20 90 H620" /><path d="M-20 360 H620" /><path d="M80 -20 V480" /><path d="M300 -20 V480" /><path d="M540 -20 V480" />
        </g>
      </svg>
      {turfs.map((t) => {
        const p = proj(t);
        const on = t.id === activeId;
        const left = Math.max(6, Math.min(94, p.x * 100));
        const top = Math.max(8, Math.min(88, p.y * 100));
        return (
          <button key={t.id} onClick={() => onPick && onPick(t)} title={t.name} style={{ position: "absolute", left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-100%)", border: "none", background: "transparent", cursor: "pointer", zIndex: on ? 5 : 2 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: on ? "var(--color-ink)" : "var(--color-primary)", color: on ? "var(--color-primary)" : "var(--color-ink)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, padding: "6px 11px", borderRadius: "var(--radius-pill)", boxShadow: "0 6px 16px rgba(14,15,12,.22)", whiteSpace: "nowrap", transform: on ? "scale(1.06)" : "none", transition: "transform 140ms ease" }}>
                {inr(t.price)}
              </div>
              <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `8px solid ${on ? "var(--color-ink)" : "var(--color-primary)"}`, marginTop: -1 }} />
            </div>
          </button>
        );
      })}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 1 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--color-accent-cyan)", border: "3px solid #fff", boxShadow: "0 0 0 6px rgba(56,200,255,.25)" }} />
      </div>
      <div style={{ position: "absolute", left: 14, bottom: 14, background: "#fff", borderRadius: "var(--radius-pill)", padding: "7px 14px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7, boxShadow: "var(--shadow-card)" }}>
        <Icon name="navigation" size={15} color="var(--color-accent-cyan)" /> Nalasopara, 401209
      </div>
    </div>
  );
}
