"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui/primitives";
import { Container, Display, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/providers/toast";
import { useSession } from "@/components/providers/session";
import { PhoneLinkModal } from "@/components/screens/VerifyModals";
import { inr, mmss } from "@/lib/format";
import type { Turf } from "@/lib/types";

type Draft = {
  turfId: string; field: string; unit: string; dateKey: string; dateLabel: string;
  startHour: number; hours: number[]; slotLabel: string; duration: number;
  total: number; players: number; perPlayer: number; until: number;
};

const stepBtn = (disabled: boolean): React.CSSProperties => ({
  width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0,
  border: "1.5px solid var(--color-ink)", background: "var(--color-canvas)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1,
});

function Row({ label, val }: { label: string; val: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", fontFamily: "var(--font-body)", fontSize: 14.5 }}>
      <span style={{ color: "var(--color-mute)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--color-ink)", textAlign: "right", whiteSpace: "nowrap" }}>{val}</span>
    </div>
  );
}

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutScreen({ turfs }: { turfs: Turf[] }) {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useSession();
  const [showPhone, setShowPhone] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [method, setMethod] = useState("upi");
  const [useWallet, setUseWallet] = useState(false);
  const [split, setSplit] = useState(false);
  const [players, setPlayers] = useState(10);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [editContact, setEditContact] = useState(false);
  const [touched, setTouched] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [, setTick] = useState(0);

  // prefill contact from the signed-in user's profile (guests fill it in)
  useEffect(() => {
    if (user) setContact({ name: user.fullName || "", phone: user.phone || "", email: user.email || "" });
  }, [user]);

  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem("turfie.draft") || "null");
      if (d) { setDraft(d); setPlayers(d.players || 10); }
    } catch {}
  }, []);
  useEffect(() => { const id = setInterval(() => setTick((n) => n + 1), 1000); return () => clearInterval(id); }, []);

  const t = useMemo(() => (draft ? turfs.find((x) => x.id === draft.turfId) : null), [draft, turfs]);

  if (!draft || !t) {
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <Icon name="clock" size={40} color="var(--color-mute)" style={{ margin: "0 auto 14px" }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--color-body)", marginBottom: 18 }}>No active booking. Pick a slot to continue.</p>
          <Button onClick={() => router.push("/browse")}>Browse turfs</Button>
        </div>
      </div>
    );
  }

  const remain = draft.until - Date.now();
  const expired = remain <= 0;
  const emailOk = /\S+@\S+\.\S+/.test(contact.email.trim());
  const phoneOk = contact.phone.replace(/\D/g, "").length >= 10;
  const contactOk = emailOk || phoneOk;
  const walletBal = user?.walletBalance || 0;
  const walletApplied = useWallet ? Math.min(walletBal, draft.total) : 0;
  const payable = draft.total - walletApplied;

  async function finalize(payment: Record<string, unknown>) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turfId: draft!.turfId, field: draft!.field, dateKey: draft!.dateKey, dateLabel: draft!.dateLabel,
        startHour: draft!.startHour, hours: draft!.hours, slotLabel: draft!.slotLabel,
        duration: `${draft!.duration} hr`, durationHrs: draft!.duration,
        players, split, contact, payment, useWallet,
      }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast(e.error || "Payment failed. Please try again.", "error");
      setProcessing(false);
      return;
    }
    const { booking, user: updatedUser } = await res.json();
    if (updatedUser) setUser(updatedUser); // reflect new wallet balance
    try { sessionStorage.setItem("turfie.lastBooking", JSON.stringify(booking)); sessionStorage.removeItem("turfie.draft"); } catch {}
    router.push("/booking/confirmed");
  }

  async function pay() {
    if (!draft) return;
    if (expired) { toast("Your hold expired. Please pick a slot again.", "error"); return; }
    if (!contactOk) { setTouched(true); toast("Add a phone number or email to continue", "error"); return; }
    setProcessing(true);
    const orderRes = await fetch("/api/checkout/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turfId: draft.turfId, field: draft.field, dateKey: draft.dateKey, hours: draft.hours, useWallet }),
    });
    if (!orderRes.ok) {
      const e = await orderRes.json().catch(() => ({}));
      setProcessing(false);
      if (orderRes.status === 403 && e.needsPhone) {
        if (user) { setShowPhone(true); }
        else { toast("Please log in and verify your phone to book.", "error"); router.push("/login"); }
        return;
      }
      toast(e.error || "Couldn't start payment.", "error");
      return;
    }
    const order = await orderRes.json();

    if (order.fullyCovered) {
      // wallet covers the whole amount — no payment gateway needed
      setTimeout(() => finalize({ orderId: "wallet", paymentId: "wallet", signature: "wallet", simulated: true }), 600);
      return;
    }
    if (order.simulated || !order.keyId) {
      // simulated PSP — confirm immediately
      setTimeout(() => finalize({ orderId: order.orderId, paymentId: "sim_pay", signature: "sim", simulated: true }), 1200);
      return;
    }

    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) { toast("Couldn't load the payment gateway.", "error"); setProcessing(false); return; }
    const rzp = new window.Razorpay({
      key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
      name: "Turfie", description: `${t!.name} · ${draft.slotLabel}`,
      prefill: { name: contact.name, email: contact.email, contact: contact.phone },
      theme: { color: "#9fe870" },
      handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        finalize({ orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature }),
      modal: { ondismiss: () => setProcessing(false) },
    });
    rzp.open();
  }

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingBottom: 64 }}>
      {showPhone && <PhoneLinkModal onClose={() => setShowPhone(false)} onVerified={(u) => { setShowPhone(false); setUser(u); toast("Phone verified — you can complete your booking now"); }} />}
      <Container style={{ paddingTop: 24 }}>
        <button onClick={() => router.push(`/turf/${t.id}/book`)} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--color-body)", marginBottom: 14 }}>
          <Icon name="arrowLeft" size={18} /> Back
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 20px", borderRadius: "var(--radius-lg)", background: expired ? "var(--color-negative-pale)" : "var(--color-warning-pale)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name={expired ? "x" : "clock"} size={20} color={expired ? "var(--color-negative-deep)" : "var(--color-warning-deep)"} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: expired ? "var(--color-negative-deep)" : "var(--color-warning-deep)" }}>
              {expired ? "Your slot hold expired — pick a slot again to continue." : "Your slot is held. Complete payment before the timer runs out."}
            </span>
          </div>
          {!expired && <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--color-warning-deep)" }}>{mmss(remain)}</span>}
          {expired && <Button size="sm" onClick={() => router.push(`/turf/${t.id}/book`)}>Pick again</Button>}
        </div>

        <Display size={34} style={{ marginBottom: 20 }}>Checkout</Display>

        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr", gap: 28, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card tone="white" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "uppercase", margin: 0 }}>Your details</h3>
                {user && !editContact && (
                  <button onClick={() => setEditContact(true)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, color: "var(--color-ink)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon name="edit" size={14} /> Use different details
                  </button>
                )}
              </div>

              {user && !editContact ? (
                /* Signed in → use the profile, don't ask */
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon name="user" size={22} color="var(--color-ink-deep)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>{contact.name || user.fullName}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[contact.email, contact.phone].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="t-form-2">
                    <Input label="Full name" placeholder="e.g. Aarav Sharma" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
                    <Input label="Phone" placeholder="+91 00000 00000" inputMode="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
                    <div style={{ gridColumn: "1 / -1" }}>
                      <Input label="Email" placeholder="you@email.com" inputMode="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                        hint={touched && !contactOk ? undefined : "Your booking confirmation goes here"}
                        error={touched && !contactOk ? "Enter a phone number or email to receive your booking" : undefined} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="shield" size={14} color="var(--color-mute)" /> Add a phone number or email — at least one is required.
                  </div>
                </>
              )}
            </Card>

            {/* Turfie wallet */}
            {user && walletBal > 0 && (
              <Card tone="white" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="wallet" size={20} color="var(--color-ink-deep)" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>Use Turfie wallet</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>Balance {inr(walletBal)}{useWallet ? ` · applying ${inr(walletApplied)}` : ""}</div>
                  </div>
                  <button onClick={() => setUseWallet((v) => !v)} aria-label="Toggle wallet" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                    <div style={{ width: 46, height: 28, borderRadius: 999, background: useWallet ? "var(--color-primary)" : "var(--border-strong)", position: "relative", transition: "background 160ms" }}>
                      <div style={{ position: "absolute", top: 3, left: useWallet ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(14,15,12,.3)", transition: "left 160ms" }} />
                    </div>
                  </button>
                </div>
              </Card>
            )}

            <Card tone="white" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "uppercase", margin: "0 0 14px" }}>Payment method</h3>
              {payable <= 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "var(--color-primary-pale)", borderRadius: "var(--radius-lg)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-ink-deep)" }}>
                  <Icon name="checkCircle" size={18} color="var(--color-positive)" /> Fully covered by your Turfie wallet — no payment needed.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {([["upi", "UPI", "Google Pay, PhonePe, Paytm", "zap"], ["card", "Card", "Visa, Mastercard, RuPay", "compass"]] as const).map(([id, name, sub, icon]) => (
                    <button key={id} onClick={() => setMethod(id)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", padding: "14px 16px", borderRadius: "var(--radius-lg)", cursor: "pointer", background: "var(--color-canvas)", border: method === id ? "1.5px solid var(--color-ink)" : "1.5px solid var(--border-subtle)" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: method === id ? "var(--color-primary)" : "var(--color-canvas-soft)", display: "grid", placeItems: "center" }}><Icon name={icon} size={20} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>{name}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>{sub}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: method === id ? "6px solid var(--color-ink)" : "2px solid var(--border-subtle)" }} />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card tone="sage" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={() => setSplit((s) => !s)} aria-label="Toggle split" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                  <div style={{ width: 46, height: 28, borderRadius: 999, background: split ? "var(--color-primary)" : "var(--border-strong)", position: "relative", transition: "background 160ms" }}>
                    <div style={{ position: "absolute", top: 3, left: split ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(14,15,12,.3)", transition: "left 160ms" }} />
                  </div>
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15.5 }}>Split the bill</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)" }}>Work out who owes what — you still pay the full amount now.</div>
                </div>
              </div>
              {split && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5, color: "var(--color-ink)" }}>Number of players</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button onClick={() => setPlayers((p) => Math.max(2, p - 1))} disabled={players <= 2} aria-label="Fewer players" style={stepBtn(players <= 2)}><Icon name="minus" size={18} /></button>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, minWidth: 28, textAlign: "center" }}>{players}</span>
                      <button onClick={() => setPlayers((p) => Math.min(22, p + 1))} disabled={players >= 22} aria-label="More players" style={stepBtn(players >= 22)}><Icon name="plus" size={18} /></button>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 16, background: "var(--color-canvas)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)" }}>Each player pays</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>{inr(Math.ceil(draft.total / players))}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", marginTop: 8 }}>{inr(draft.total)} ÷ {players} players · collect their share however you like.</div>
                </div>
              )}
            </Card>
          </div>

          <div style={{ position: "sticky", top: 92 }}>
            <Card tone="white" style={{ padding: 24, border: "1px solid var(--color-ink)" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0 }}><CourtArt sport={t.primary} height={56} /></div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>{t.name}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", marginTop: 2 }}>{t.area}</div>
                </div>
              </div>
              <Row label="Date" val={draft.dateLabel} />
              <Row label={draft.unit || "Field"} val={`${draft.unit || "Field"} ${draft.field}`} />
              <Row label="Time" val={draft.slotLabel} />
              <Row label="Duration" val={`${draft.duration} hr`} />
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "12px 0" }} />
              <Row label="Subtotal" val={inr(draft.total)} />
              <Row label="Convenience fee" val="Free" />
              {walletApplied > 0 && <Row label="Turfie wallet" val={`– ${inr(walletApplied)}`} />}
              {split && <Row label={`Split ${players} ways`} val={`${inr(Math.ceil(draft.total / players))} each`} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>{walletApplied > 0 ? "To pay" : "Total"}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28 }}>{inr(payable)}</span>
              </div>
              <Button fullWidth size="lg" style={{ marginTop: 18 }} disabled={expired || processing} onClick={pay} iconRight={!processing ? <Icon name="arrowRight" size={18} /> : undefined}>
                {processing ? "Processing…" : payable <= 0 ? "Confirm booking" : `Pay ${inr(payable)} & confirm`}
              </Button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>
                <Icon name="shield" size={14} color="var(--color-positive)" /> Secured payment · 256-bit encryption
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
