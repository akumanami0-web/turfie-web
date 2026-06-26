"use client";
import React, { useEffect } from "react";
import { Icon } from "./Icon";

export function ModalShell({ children, onClose, maxWidth = 480 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div onClick={onClose} className="t-modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(14,15,12,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--color-canvas)", borderRadius: 24, padding: 28, width: "100%", maxWidth, maxHeight: "88vh", overflowY: "auto", boxShadow: "var(--shadow-pop)", position: "relative" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--color-canvas-soft)", cursor: "pointer", display: "grid", placeItems: "center", zIndex: 1 }}><Icon name="x" size={18} /></button>
        {children}
      </div>
    </div>
  );
}
