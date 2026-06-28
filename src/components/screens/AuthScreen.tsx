"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui/primitives";
import { Display, Eyebrow, AvatarStack } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import type { SessionUser } from "@/lib/types";

const OAUTH_ERRORS: Record<string, string> = {
  provider_not_configured: "That sign-in option isn't configured yet.",
  bad_state: "Sign-in expired — please try again.",
  exchange_failed: "Couldn't complete sign-in. Please try again.",
  no_email: "That account didn't share an email address.",
};

export function AuthScreen({ mode = "login" }: { mode?: "login" | "signup" }) {
  const router = useRouter();
  const { setUser } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");
  const [simulated, setSimulated] = useState(false);
  useEffect(() => setTab(mode), [mode]);
  useEffect(() => { setAwaitingCode(false); setCode(""); }, [tab]);
  // surface ?error= from an OAuth callback failure
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) toast(OAUTH_ERRORS[err] || "Sign-in failed. Please try again.", "error");
  }, [toast]);
  const isLogin = tab === "login";

  function finish(user: SessionUser) {
    setUser(user);
    toast(isLogin ? "Welcome back!" : "Account created — welcome to Turfie!");
    router.push("/account");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (isLogin) {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) { toast(data.error || "Something went wrong", "error"); return; }
      finish(data.user);
      return;
    }
    // signup: try to register; if email verification is required, send a code
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (res.ok) { setBusy(false); finish(data.user); return; }
    if (res.status === 400 && data.needsCode) {
      const s = await fetch("/api/otp/email/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose: "signup" }) });
      const sd = await s.json().catch(() => ({}));
      setBusy(false);
      if (!s.ok) { toast(sd.error || "Couldn't send the code", "error"); return; }
      setSimulated(!!sd.simulated);
      setAwaitingCode(true);
      toast("We sent a verification code to your email");
      return;
    }
    setBusy(false);
    toast(data.error || "Something went wrong", "error");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, code }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast(data.error || "Incorrect code", "error"); return; }
    finish(data.user);
  }

  return (
    <div className="t-auth-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 72px)" }}>
      <div style={{ display: "grid", placeItems: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <Eyebrow style={{ marginBottom: 10 }}>{isLogin ? "Welcome back" : "Join Turfie"}</Eyebrow>
          <Display size={38} style={{ marginBottom: 8 }}>{isLogin ? "Log in to play" : "Create your account"}</Display>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, color: "var(--color-body)", margin: "0 0 28px" }}>
            {isLogin ? "Book turfs, manage your squad and track your games." : "Book in seconds and split the cost with your squad."}
          </p>

          <div style={{ display: "flex", gap: 4, background: "var(--color-canvas-soft)", borderRadius: "var(--radius-pill)", padding: 4, marginBottom: 22 }}>
            {([["login", "Log in"], ["signup", "Sign up"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, background: tab === id ? "var(--color-canvas)" : "transparent", color: "var(--color-ink)", boxShadow: tab === id ? "var(--shadow-card)" : "none" }}>{label}</button>
            ))}
          </div>

          {awaitingCode ? (
            <form onSubmit={submitCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)", margin: "0 0 4px" }}>Enter the 6-digit code we sent to <strong>{email}</strong>.</p>
              <Input label="Verification code" placeholder="••••••" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              {simulated && (
                <div style={{ padding: "10px 12px", background: "var(--color-warning-pale)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-warning-content)" }}>
                  Test mode — email delivery isn&apos;t connected yet; check the server logs for your code.
                </div>
              )}
              <Button type="submit" fullWidth size="lg" disabled={busy || code.length < 4} iconRight={<Icon name="check" size={18} />}>{busy ? "Verifying…" : "Verify & create account"}</Button>
              <button type="button" onClick={() => setAwaitingCode(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--color-body)" }}>← Back</button>
            </form>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!isLogin && <Input label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />}
              <Input label="Email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              {isLogin && <button type="button" onClick={() => toast("Reset link sent")} style={{ alignSelf: "flex-end", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--color-ink)" }}>Forgot password?</button>}
              <Button type="submit" fullWidth size="lg" disabled={busy} iconRight={<Icon name="arrowRight" size={18} />}>{busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}</Button>
            </form>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>
          <Button variant="tertiary" fullWidth iconLeft={<Icon name="google" size={18} />}
            onClick={() => { window.location.href = "/api/auth/oauth/google"; }}>
            Continue with Google
          </Button>
        </div>
      </div>

      <div className="t-auth-panel" style={{ background: "var(--color-ink)", position: "relative", overflow: "hidden", display: "grid", placeItems: "center", padding: 48 }}>
        <div style={{ position: "absolute", right: -60, top: -40, opacity: 0.14 }}><SportGlyph sport="football" size={360} color="var(--color-primary)" stroke={2} /></div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 380 }}>
          <Display size={44} style={{ color: "var(--color-primary)", marginBottom: 18 }}>Real grass, real goals — booked in seconds.</Display>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.55, color: "rgba(255,255,255,.8)", margin: "0 0 26px" }}>
            Join thousands of players across Maharashtra booking pitches and courts every week.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AvatarStack people={["RS", "AK", "MJ", "SK"]} extra={120} size={40} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,.7)" }}>booked this week</span>
          </div>
        </div>
      </div>
    </div>
  );
}
