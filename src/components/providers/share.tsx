"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "./toast";

export type SharePayload = { title?: string; subtitle?: string; url?: string; hash?: string };
const ShareContext = createContext<(p: SharePayload) => void>(() => {});

const SHARE_GLYPH: Record<string, React.ReactNode> = {
  whatsapp: <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7s-3.7-3.2-3.8-3.3c-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.9c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.7 1.6c.1.1.1.3 0 .5l-.3.4-.3.3c-.1.1-.2.2-.1.5s.5.9 1 1.4c.7.6 1.2.8 1.5.9.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.5.7c.2.1.4.2.4.3.1.1.1.6 0 1z" />,
  telegram: <path d="M21.9 4.3 2.7 11.7c-.9.4-.9 1.6 0 1.9l4.7 1.5 1.8 5.7c.2.6 1 .8 1.5.3l2.6-2.5 4.8 3.5c.6.4 1.4.1 1.5-.6l3-14.5c.2-.9-.7-1.6-1.7-1.2zM9.6 14.3l8.3-5.2c.2-.1.4.2.2.3l-6.7 6.2-.3 3.4-1.5-4.7z" />,
  facebook: <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />,
  x: <path d="M17.5 3h3l-6.6 7.5L21.8 21h-6l-4.7-6-5.3 6H2.8l7-8L2.4 3h6.2l4.2 5.5L17.5 3zm-1 16h1.6L7.6 4.7H5.9L16.5 19z" />,
  email: <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7 8-5H4l8 5zm0 2L4 9v9h16V9l-8 5z" />,
};

const SHARE_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", bg: "#25D366", href: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(t + " " + u)}` },
  { id: "telegram", label: "Telegram", bg: "#229ED9", href: (u: string, t: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { id: "facebook", label: "Facebook", bg: "#1877F2", href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: "x", label: "X", bg: "#0e0f0c", href: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { id: "email", label: "Email", bg: "#454745", href: (u: string, t: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(t + "\n" + u)}` },
];

export function ShareProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SharePayload | null>(null);
  const toast = useToast();
  const open = useCallback((p: SharePayload) => setData(p || {}), []);
  const close = () => setData(null);

  return (
    <ShareContext.Provider value={open}>
      {children}
      {data && <ShareSheet data={data} onClose={close} toast={toast} />}
    </ShareContext.Provider>
  );
}

function ShareSheet({ data, onClose, toast }: { data: SharePayload; onClose: () => void; toast: (m: string, t?: "success" | "error" | "warning") => void }) {
  const url = data.url || (typeof location !== "undefined" ? location.origin + location.pathname + (data.hash || "") : "");
  const title = data.title || "Check out this turf on Turfie";

  const chip = (bg: string, glyph: React.ReactNode, label: string, onClick: (() => void) | null, href?: string) => {
    const inner = (
      <>
        <span style={{ width: 56, height: 56, borderRadius: "50%", background: bg, display: "grid", placeItems: "center", boxShadow: "var(--shadow-card)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">{glyph}</svg>
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "var(--color-body)" }}>{label}</span>
      </>
    );
    const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 };
    return href ? (
      <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(onClose, 100)} style={wrap}>{inner}</a>
    ) : (
      <button key={label} onClick={onClick || undefined} style={wrap}>{inner}</button>
    );
  };

  const copy = () => { navigator.clipboard?.writeText(url); toast("Link copied to clipboard"); };

  return (
    <div onClick={onClose} className="t-share-overlay" style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(14,15,12,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
      <div onClick={(e) => e.stopPropagation()} className="t-share-card" style={{ background: "var(--color-canvas)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "24px 22px calc(28px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 460, boxShadow: "var(--shadow-pop)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, textTransform: "uppercase", margin: 0 }}>Share</h3>
          <button onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--color-canvas-soft)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={18} /></button>
        </div>
        {data.subtitle && <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)", margin: "0 0 18px" }}>{data.subtitle}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: 16, marginTop: 14, marginBottom: 18 }}>
          {SHARE_CHANNELS.map((c) => chip(c.bg, SHARE_GLYPH[c.id], c.label, null, c.href(url, title)))}
          {chip("linear-gradient(45deg,#f09433,#e6683c,#dc2743,#bc1888)", <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.1.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.1-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.1-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.1 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1 0 18.6 12 6.6 6.6 0 0 0 12 5.4zm0 10.9A4.3 4.3 0 1 1 16.3 12 4.3 4.3 0 0 1 12 16.3zm6.8-11.2a1.5 1.5 0 1 1-1.5-1.5 1.5 1.5 0 0 1 1.5 1.5z" />, "Instagram", () => { navigator.clipboard?.writeText(url); toast("Link copied — paste into your Instagram story"); onClose(); })}
          {chip("var(--color-primary)", <path d="M9 17H7A5 5 0 0 1 7 7h2v2H7a3 3 0 0 0 0 6h2zm6-10h2a5 5 0 0 1 0 10h-2v-2h2a3 3 0 0 0 0-6h-2zM8 11h8v2H8z" stroke="#0e0f0c" fill="#0e0f0c" />, "Copy link", copy)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--color-canvas-soft)", borderRadius: "var(--radius-lg)", padding: "12px 14px" }}>
          <span style={{ flex: 1, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
          <button onClick={copy} style={{ flexShrink: 0, background: "var(--color-ink)", color: "var(--color-canvas)", border: "none", borderRadius: "var(--radius-pill)", padding: "8px 16px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Copy</button>
        </div>
      </div>
    </div>
  );
}

export const useShare = () => useContext(ShareContext);
