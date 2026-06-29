"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { fmtDateShort } from "@/lib/format";

type Result = {
  id: string; turfName: string; area: string; sport: string; unit: string; field: string;
  dateLabel: string; time: string; duration: string; status: string; checkedInAt: number | null; name?: string | null;
};

function extractToken(text: string): string {
  try {
    const u = new URL(text);
    return u.searchParams.get("t") || text;
  } catch {
    return text;
  }
}

export function ScanScreen({ embedded = false }: { embedded?: boolean }) {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useSession();
  const isOperator = user?.role === "operator";

  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const verify = useCallback(async (tok: string) => {
    setError(null);
    const res = await fetch("/api/tickets/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: tok }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) { setError(data.error || "Invalid ticket."); setResult(null); return; }
    setToken(tok);
    setResult(data.booking);
  }, []);

  // deep-linked token (?t=) — verify immediately
  useEffect(() => {
    const t = sp.get("t");
    if (t) verify(t);
  }, [sp, verify]);

  const stopCamera = useCallback(() => { controlsRef.current?.stop(); controlsRef.current = null; setScanning(false); }, []);

  const startCamera = useCallback(async () => {
    setError(null); setResult(null); setScanning(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanning(false);
      setError("This browser can't open the camera. Try Chrome/Safari directly (not an in-app browser).");
      return;
    }
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const onResult = (res: { getText: () => string } | undefined, _err: unknown, ctrl: { stop: () => void }) => {
        if (res) { ctrl.stop(); controlsRef.current = null; setScanning(false); verify(extractToken(res.getText())); }
      };
      // Prefer the back camera; this call triggers the permission prompt.
      let controls;
      try {
        controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoRef.current!, onResult);
      } catch {
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, onResult);
      }
      controlsRef.current = controls;
    } catch (e) {
      setScanning(false);
      const name = (e as { name?: string })?.name || "";
      if (name === "NotAllowedError") setError("Camera permission was blocked. Allow it in your browser settings, then try again.");
      else if (name === "NotFoundError") setError("No camera found on this device.");
      else setError("Couldn't open the camera. Make sure you're in Chrome/Safari (not an in-app browser) and try again.");
    }
  }, [verify]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function checkIn() {
    if (!token) return;
    setBusy(true);
    const res = await fetch("/api/tickets/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Check-in failed", "error"); return; }
    toast(data.already ? "Already checked in" : "Checked in ✓");
    setResult((r) => (r ? { ...r, checkedInAt: data.checkedInAt } : r));
  }

  const reset = () => { setResult(null); setToken(null); setError(null); };

  const inner = (
    <>
        {!isOperator && (
          <Card tone="green" style={{ padding: "14px 16px", marginBottom: 18, display: "flex", gap: 10, alignItems: "center" }}>
            <Icon name="shield" size={18} color="var(--color-ink-deep)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-ink-deep)" }}>
              Staff sign-in is required to check players in. {user ? "This account isn't a venue operator." : "Please log in as venue staff."}
            </span>
          </Card>
        )}

        {/* scanner */}
        {isOperator && !result && (
          <Card tone="white" style={{ padding: 20, marginBottom: 18 }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-ink)" }}>
              <video ref={videoRef} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {!scanning && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,.85)" }}>
                  <div style={{ textAlign: "center" }}>
                    <Icon name="navigation" size={34} color="var(--color-primary)" />
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, marginTop: 8 }}>Camera is off</div>
                  </div>
                </div>
              )}
              {scanning && <div style={{ position: "absolute", inset: 18, border: "2px solid var(--color-primary)", borderRadius: "var(--radius-md)", pointerEvents: "none" }} />}
            </div>
            <div style={{ marginTop: 14 }}>
              {scanning
                ? <Button variant="tertiary" fullWidth onClick={stopCamera}>Stop camera</Button>
                : <Button fullWidth onClick={startCamera} iconLeft={<Icon name="navigation" size={17} />}>Start scanning</Button>}
            </div>
          </Card>
        )}

        {error && (
          <Card tone="white" style={{ padding: 18, marginBottom: 18, display: "flex", gap: 10, alignItems: "center" }}>
            <Icon name="x" size={20} color="var(--color-negative)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--color-negative-deep)" }}>{error}</span>
          </Card>
        )}

        {/* result */}
        {result && (
          <Card tone="white" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{result.turfName}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", marginTop: 2 }}>{result.area} · {result.id}</div>
              </div>
              {result.checkedInAt
                ? <Badge variant="neutral">Used</Badge>
                : result.status === "cancelled" ? <Badge variant="negative">Cancelled</Badge> : <Badge variant="positive">Valid</Badge>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              {[["Date", result.dateLabel], ["Time", result.time], [result.unit, `${result.unit} ${result.field}`], ["Booked by", result.name || "—"]].map(([l, v]) => (
                <div key={l}><div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--color-mute)" }}>{l}</div><div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, marginTop: 2 }}>{v}</div></div>
              ))}
            </div>

            {result.checkedInAt ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "var(--color-warning-pale)", borderRadius: "var(--radius-lg)" }}>
                <Icon name="clock" size={18} color="var(--color-warning-deep)" />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-warning-content)" }}>Already checked in on {fmtDateShort(new Date(result.checkedInAt))}.</span>
              </div>
            ) : result.status === "cancelled" ? (
              <div style={{ padding: "14px 16px", background: "var(--color-negative-pale)", borderRadius: "var(--radius-lg)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-negative-deep)" }}>This booking was cancelled — do not admit.</div>
            ) : isOperator ? (
              <Button fullWidth size="lg" disabled={busy} onClick={checkIn} iconRight={<Icon name="check" size={18} />}>{busy ? "Checking in…" : "Check in"}</Button>
            ) : (
              <div style={{ padding: "14px 16px", background: "var(--color-primary-pale)", borderRadius: "var(--radius-lg)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-ink-deep)" }}>This pass is valid. Venue staff will scan it at the gate.</div>
            )}

            {isOperator && (
              <Button variant="ghost" fullWidth style={{ marginTop: 10 }} onClick={() => { reset(); if (!embedded) router.replace("/scan"); }}>Scan another</Button>
            )}
          </Card>
        )}
    </>
  );

  if (embedded) return <div style={{ maxWidth: 480 }}>{inner}</div>;

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 24, paddingBottom: 64 }}>
      <Container style={{ maxWidth: 480 }}>
        <Eyebrow style={{ marginBottom: 6 }}>Venue check-in</Eyebrow>
        <Display size={30} style={{ marginBottom: 18 }}>Scan entry pass</Display>
        {inner}
      </Container>
    </div>
  );
}
