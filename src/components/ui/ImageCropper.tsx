"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./primitives";
import { Icon } from "./Icon";

const VIEW = 300;   // on-screen crop viewport (square)
const OUT = 1024;   // exported avatar resolution

/** Mandatory square/circle crop step before uploading an avatar.
    Drag to reposition, slider to zoom, Done to export a JPEG blob. */
export function ImageCropper({ src, onCancel, onDone }: { src: string; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);

  const base = img ? Math.max(VIEW / img.width, VIEW / img.height) : 1;
  const scale = base * zoom;
  const dispW = img ? img.width * scale : 0;
  const dispH = img ? img.height * scale : 0;

  // keep the image covering the viewport
  const clamp = useCallback((p: { x: number; y: number }) => {
    const maxX = Math.max(0, (dispW - VIEW) / 2);
    const maxY = Math.max(0, (dispH - VIEW) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) };
  }, [dispW, dispH]);

  useEffect(() => { setPan((p) => clamp(p)); }, [zoom, clamp]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPan(clamp({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) }));
  }
  function onPointerUp() { drag.current = null; }

  function done() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, OUT, OUT);
    // source rect under the viewport, mapped to image pixels
    const imageLeft = (VIEW - dispW) / 2 + pan.x;
    const imageTop = (VIEW - dispH) / 2 + pan.y;
    const sx = -imageLeft / scale;
    const sy = -imageTop / scale;
    const sSize = VIEW / scale;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
    canvas.toBlob((b) => { if (b) onDone(b); }, "image/jpeg", 0.92);
  }

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(14,15,12,.6)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, margin: 0 }}>Crop photo</h3>
          <button onClick={onCancel} aria-label="Cancel" style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={22} color="var(--color-mute)" /></button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            style={{ position: "relative", width: VIEW, height: VIEW, maxWidth: "100%", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-canvas-soft)", cursor: "grab", touchAction: "none" }}>
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={src} draggable={false} style={{ position: "absolute", left: "50%", top: "50%", width: dispW, height: dispH, transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`, userSelect: "none", pointerEvents: "none" }} />
            )}
            {/* circular crop guide: darken everything outside the circle */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "50%", boxShadow: "0 0 0 2000px rgba(14,15,12,.45)", border: "2px solid var(--color-primary)" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Icon name="search" size={16} color="var(--color-mute)" />
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: "var(--color-primary)" }} aria-label="Zoom" />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="tertiary" fullWidth onClick={onCancel}>Cancel</Button>
          <Button fullWidth onClick={done} disabled={!img} iconRight={<Icon name="check" size={18} />}>Done</Button>
        </div>
      </div>
    </div>
  );
}
