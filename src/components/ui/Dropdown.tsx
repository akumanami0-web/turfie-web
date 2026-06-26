"use client";
import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";

export type Option = { value: string; label: string };

/** Branded dropdown (replaces native <select> — identical on desktop & mobile). */
export function Dropdown({
  value, onChange, options, placeholder = "Select", icon = null, full = true, align = "left",
}: {
  value: string; onChange: (v: string) => void; options: Option[];
  placeholder?: string; icon?: React.ReactNode; full?: boolean; align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", esc); };
  }, [open]);
  const sel = options.find((o) => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative", width: full ? "100%" : "auto" }}>
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
          border: `1px solid ${open ? "var(--color-ink)" : "var(--border-subtle)"}`, borderRadius: "var(--radius-md)",
          background: "var(--color-canvas)", padding: "12px 14px", boxSizing: "border-box",
          fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: sel ? "var(--color-ink)" : "var(--color-mute)",
        }}
      >
        {icon}
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel ? sel.label : placeholder}</span>
        <span style={{ display: "inline-flex", transition: "transform 160ms ease", transform: open ? "rotate(180deg)" : "none" }}><Icon name="chevronDown" size={18} color="var(--color-ink)" /></span>
      </button>
      {open && (
        <div
          role="listbox" className="t-scroll-x"
          style={{
            position: "absolute", top: "calc(100% + 6px)", [align]: 0, minWidth: "100%", zIndex: 90,
            background: "var(--color-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-pop)", padding: 6, maxHeight: 288, overflowY: "auto",
          } as React.CSSProperties}
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value} role="option" aria-selected={on}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", textAlign: "left",
                  padding: "11px 12px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                  background: on ? "var(--color-primary-pale)" : "transparent",
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: on ? 700 : 600, color: "var(--color-ink)", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--color-canvas-soft)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                {o.label}{on && <Icon name="check" size={16} color="var(--color-ink-deep)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
