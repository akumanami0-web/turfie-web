"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n: number) => String(n).padStart(2, "0");
const toYMD = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
function parse(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
}

const navBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border-subtle)", background: "var(--color-canvas)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 };
const linkBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, color: "var(--color-ink)" };

/** Brand-styled date picker (replaces the OS-native one so it matches Turfie). */
export function DatePicker({ value, onChange, placeholder = "DD / MM / YYYY", max, min, future = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; max?: string; min?: string; future?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "year">("day");
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  const sel = useMemo(() => parse(value), [value]);
  const maxD = max ? parse(max) : null;
  const minD = min ? parse(min) : null;
  const [view, setView] = useState(() => (sel ? { y: sel.y, m: sel.m } : { y: today.getFullYear() - (future ? 0 : 18), m: today.getMonth() }));

  useEffect(() => { if (open && sel) setView({ y: sel.y, m: sel.m }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setMode("day"); } };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setMode("day"); } };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", esc); };
  }, [open]);

  const display = sel ? `${pad(sel.d)} / ${pad(sel.m + 1)} / ${sel.y}` : "";
  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cmp = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;
  const blocked = (y: number, m: number, d: number) =>
    (maxD ? cmp(y, m, d) > cmp(maxD.y, maxD.m, maxD.d) : false) ||
    (minD ? cmp(y, m, d) < cmp(minD.y, minD.m, minD.d) : false);

  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const minYear = minD ? minD.y : 1925;
  const maxYear = maxD ? maxD.y : today.getFullYear() + (future ? 2 : 0);
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "var(--color-canvas)", border: "1px solid var(--color-ink)", borderRadius: "var(--radius-md)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 16, color: display ? "var(--color-ink)" : "var(--color-mute)" }}>
        <span>{display || placeholder}</span>
        <Icon name="calendar" size={18} color="var(--color-mute)" />
      </button>

      {open && (
        <div style={{ position: "absolute", zIndex: 50, top: "calc(100% + 8px)", left: 0, width: 304, maxWidth: "92vw", background: "var(--color-canvas)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", border: "1px solid var(--border-subtle)", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={navBtn} aria-label="Previous month"><Icon name="arrowLeft" size={16} /></button>
            <button type="button" onClick={() => setMode((m) => (m === "day" ? "year" : "day"))}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15.5, color: "var(--color-ink)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {MONTHS[view.m]} {view.y} <Icon name="chevronDown" size={14} />
            </button>
            <button type="button" onClick={nextMonth} style={navBtn} aria-label="Next month"><Icon name="arrowRight" size={16} /></button>
          </div>

          {mode === "year" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, maxHeight: 232, overflowY: "auto" }}>
              {years.map((y) => {
                const on = y === view.y;
                return (
                  <button key={y} type="button" onClick={() => { setView((v) => ({ ...v, y })); setMode("day"); }}
                    style={{ padding: "9px 0", borderRadius: "var(--radius-md)", border: on ? "1.5px solid var(--color-ink)" : "1.5px solid transparent", background: on ? "var(--color-ink)" : "var(--color-canvas-soft)", color: on ? "var(--color-canvas)" : "var(--color-ink)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5 }}>
                    {y}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                {DOW.map((d, i) => <div key={i} style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "var(--color-mute)", padding: "4px 0" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {Array.from({ length: firstDow }).map((_, i) => <div key={"b" + i} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSel = !!sel && sel.y === view.y && sel.m === view.m && sel.d === d;
                  const isToday = today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
                  const dis = blocked(view.y, view.m, d);
                  return (
                    <button key={d} type="button" disabled={dis} onClick={() => { onChange(toYMD(view.y, view.m, d)); setOpen(false); setMode("day"); }}
                      style={{ aspectRatio: "1", borderRadius: "50%", border: isToday && !isSel ? "1.5px solid var(--color-primary)" : "1.5px solid transparent", background: isSel ? "var(--color-ink)" : "transparent", color: isSel ? "var(--color-canvas)" : dis ? "var(--color-mute)" : "var(--color-ink)", cursor: dis ? "not-allowed" : "pointer", opacity: dis ? 0.4 : 1, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, display: "grid", placeItems: "center" }}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                <button type="button" onClick={() => { onChange(""); setOpen(false); setMode("day"); }} style={linkBtn}>Clear</button>
                <button type="button" onClick={() => { setOpen(false); setMode("day"); }} style={linkBtn}>Done</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
