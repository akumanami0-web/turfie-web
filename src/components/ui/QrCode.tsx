"use client";
import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

/** Renders a QR code to a canvas (brand ink on white). */
export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      QRCode.toCanvas(ref.current, value, { width: size, margin: 1, color: { dark: "#0e0f0c", light: "#ffffff" } }).catch(() => {});
    }
  }, [value, size]);
  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size, display: "block" }} />;
}
