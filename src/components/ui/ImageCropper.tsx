"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./primitives";
import { Icon } from "./Icon";

const OUT = 1024;   // exported avatar resolution
const MAX_ZOOM = 4;

/** Mandatory crop step before uploading an avatar.
    Drag (one finger) to reposition, pinch (two fingers) or scroll to zoom.
    The viewport is measured so it's always a true square (no stretching). */
export function ImageCropper({ src, onCancel, onDone }: { src: string; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [view, setView] = useState(280);          // actual rendered viewport size (px)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement | null>(null);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);

  // measure the (square) viewport so the crop maths use real pixels
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setView(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const base = img ? Math.max(view / img.width, view / img.height) : 1;
  const scale = base * zoom;
  const dispW = img ? img.width * scale : 0;
  const dispH = img ? img.height * scale : 0;

  const clamp = useCallback((p: { x: number; y: number }) => {
    const maxX = Math.max(0, (dispW - view) / 2);
    const maxY = Math.max(0, (dispH - view) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) };
  }, [dispW, dispH, view]);

  useEffect(() => { setPan((p) => clamp(p)); }, [zoom, view, clamp]);

  const dist = () => {
    const pts = [...pointers.current.values()];
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    } else if (pointers.current.size === 2) {
      pinchStart.current = { dist: dist(), zoom };
      dragStart.current = null;
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinchStart.current) {
      const ratio = dist() / pinchStart.current.dist;
      setZoom(Math.min(MAX_ZOOM, Math.max(1, pinchStart.current.zoom * ratio)));
    } else if (dragStart.current) {
      setPan(clamp({ x: dragStart.current.px + (e.clientX - dragStart.current.x), y: dragStart.current.py + (e.clientY - dragStart.current.y) }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    pinchStart.current = null;
    const rest = [...pointers.current.values()][0];
    dragStart.current = rest ? { x: rest.x, y: rest.y, px: pan.x, py: pan.y } : null;
  }
  function onWheel(e: React.WheelEvent) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.0015)));
  }

  function done() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, OUT, OUT);
    const imageLeft = (view - dispW) / 2 + pan.x;
    const imageTop = (view - dispH) / 2 + pan.y;
    const sSize = view / scale;
    ctx.drawImage(img, -imageLeft / scale, -imageTop / scale, sSize, sSize, 0, 0, OUT, OUT);
    canvas.toBlob((b) => { if (b) onDone(b); }, "image/jpeg", 0.92);
  }

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(14,15,12,.6)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, margin: 0 }}>Crop photo</h3>
          <button onClick={onCancel} aria-label="Cancel" style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={22} color="var(--color-mute)" /></button>
        </div>

        <div
          ref={boxRef}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}
          style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-canvas-soft)", cursor: "grab", touchAction: "none", marginBottom: 12 }}>
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={src} draggable={false} style={{ position: "absolute", left: "50%", top: "50%", width: dispW, height: dispH, transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`, userSelect: "none", pointerEvents: "none" }} />
          )}
          {/* circular crop guide: darken everything outside the circle */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "50%", boxShadow: "0 0 0 2000px rgba(14,15,12,.45)", border: "2px solid var(--color-primary)" }} />
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", margin: "0 0 18px" }}>
          Drag to reposition · pinch or scroll to zoom
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="tertiary" fullWidth onClick={onCancel}>Cancel</Button>
          <Button fullWidth onClick={done} disabled={!img} iconRight={<Icon name="check" size={18} />}>Done</Button>
        </div>
      </div>
    </div>
  );
}
