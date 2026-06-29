"use client";
import React, { useState } from "react";
import { Button, Input, Chip } from "@/components/ui/primitives";
import { Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/toast";
import type { SessionUser } from "@/lib/types";

function CodeNote({ simulated }: { simulated: boolean }) {
  if (!simulated) return null;
  return (
    <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--color-warning-pale)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-warning-content)" }}>
      Test mode — the SMS/WhatsApp provider isn&apos;t connected yet, so use code <strong>123456</strong>.
    </div>
  );
}

/** Link + verify a phone number (one-time; can't be changed afterwards). */
export function PhoneLinkModal({ onClose, onVerified }: { onClose: () => void; onVerified: (u: SessionUser) => void }) {
  const toast = useToast();
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">("whatsapp");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [simulated, setSimulated] = useState(false);

  async function send() {
    setBusy(true);
    const res = await fetch("/api/otp/phone/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, channel }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't send the code", "error"); return; }
    setSimulated(!!data.simulated);
    setStep("code");
    toast(`Code sent via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}`);
  }

  async function verify() {
    setBusy(true);
    const res = await fetch("/api/profile/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't verify", "error"); return; }
    toast("Phone verified");
    onVerified(data.user);
  }

  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <Eyebrow style={{ marginBottom: 6 }}>Verify phone</Eyebrow>
      <Display size={24} style={{ marginBottom: 8 }}>{step === "enter" ? "Add your phone number" : "Enter the code"}</Display>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)", margin: "0 0 18px" }}>
        {step === "enter" ? "Your number is verified once and can't be changed later. It keeps your bookings secure." : `We sent a 6-digit code to ${phone}.`}
      </p>

      {step === "enter" ? (
        <>
          <Input label="Phone number" placeholder="+91 98765 43210" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 4 }}>
            <Chip selected={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>WhatsApp</Chip>
            <Chip selected={channel === "sms"} onClick={() => setChannel("sms")}>SMS</Chip>
          </div>
          <Button fullWidth size="lg" style={{ marginTop: 18 }} disabled={busy || !phone.trim()} onClick={send} iconRight={<Icon name="arrowRight" size={18} />}>
            {busy ? "Sending…" : "Send code"}
          </Button>
        </>
      ) : (
        <>
          <Input label="6-digit code" placeholder="••••••" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          <CodeNote simulated={simulated} />
          <Button fullWidth size="lg" style={{ marginTop: 18 }} disabled={busy || code.length < 4} onClick={verify} iconRight={<Icon name="check" size={18} />}>
            {busy ? "Verifying…" : "Verify & link"}
          </Button>
          <button onClick={() => setStep("enter")} style={{ width: "100%", marginTop: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--color-body)" }}>← Use a different number</button>
        </>
      )}
    </ModalShell>
  );
}

/** Change account email — requires a verified phone, then an email OTP. */
export function ChangeEmailModal({ currentEmail, onClose, onVerified }: { currentEmail: string; onClose: () => void; onVerified: (u: SessionUser) => void }) {
  const toast = useToast();
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [simulated, setSimulated] = useState(false);

  async function send() {
    setBusy(true);
    const res = await fetch("/api/otp/email/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose: "change_email" }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't send the code", "error"); return; }
    setSimulated(!!data.simulated);
    setStep("code");
    toast("Code sent to your new email");
  }

  async function verify() {
    setBusy(true);
    const res = await fetch("/api/profile/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't change email", "error"); return; }
    toast("Email updated");
    onVerified(data.user);
  }

  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <Eyebrow style={{ marginBottom: 6 }}>Change email</Eyebrow>
      <Display size={24} style={{ marginBottom: 8 }}>{step === "enter" ? "New email address" : "Enter the code"}</Display>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)", margin: "0 0 18px" }}>
        {step === "enter" ? `Currently ${currentEmail}. We'll send a code to your new address to confirm it's yours.` : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "enter" ? (
        <>
          <Input label="New email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button fullWidth size="lg" style={{ marginTop: 18 }} disabled={busy || !email.trim()} onClick={send} iconRight={<Icon name="arrowRight" size={18} />}>
            {busy ? "Sending…" : "Send code"}
          </Button>
        </>
      ) : (
        <>
          <Input label="6-digit code" placeholder="••••••" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          {simulated && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--color-warning-pale)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-warning-content)" }}>
              Demo mode — email isn&apos;t connected yet, so use code <strong>123456</strong>.
            </div>
          )}
          <Button fullWidth size="lg" style={{ marginTop: 18 }} disabled={busy || code.length < 4} onClick={verify} iconRight={<Icon name="check" size={18} />}>
            {busy ? "Verifying…" : "Verify & update"}
          </Button>
          <button onClick={() => setStep("enter")} style={{ width: "100%", marginTop: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--color-body)" }}>← Use a different email</button>
        </>
      )}
    </ModalShell>
  );
}
