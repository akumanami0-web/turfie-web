"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { useFavourites } from "@/lib/useFavourites";
import { profileSteps } from "@/lib/profile";
import { inr } from "@/lib/format";
import type { Booking } from "@/lib/types";

export function AccountScreen({ bookings, initialFav }: { bookings: Booking[]; initialFav: string[] }) {
  const router = useRouter();
  const { user, logout } = useSession();
  const toast = useToast();
  const { fav } = useFavourites(initialFav);
  if (!user) return null;

  const upcoming = bookings.filter((b) => b.status === "upcoming").length;
  const refundCount = bookings.filter((b) => b.status === "cancelled").length;
  // Real stats from the user's own bookings (no placeholder fallbacks).
  const completed = bookings.filter((b) => b.status === "completed");
  const played = completed.length;
  const hoursPlayed = completed.reduce((s, b) => s + (b.durationHrs || 1), 0);
  const steps = profileSteps(user);
  const profilePct = Math.round((steps.done / steps.total) * 100);

  const menu: [string, string, string, () => void][] = [
    ["calendar", "My bookings", `${upcoming} upcoming`, () => router.push("/account/bookings")],
    ["refresh", "Refunds", refundCount ? `${refundCount} tracked` : "Track refunds", () => router.push("/account/refunds")],
    ["heart", "Saved turfs", `${fav.length} saved`, () => router.push("/account/saved")],
    ["edit", "Edit profile", "Name, birthday, more", () => router.push("/account/edit")],
    ["users", "Battles", "Join tournaments", () => router.push("/battles")],
    ["compass", "Payment methods", "UPI · Card · Wallet", () => toast("Payments coming soon")],
    ["shield", "Privacy & security", "Password, data", () => toast("Settings coming soon")],
  ];
  if (user.vendor) menu.unshift(["compass", "Turfie Onboard", "Your turf bookings", () => router.push("/onboard")] as [string, string, string, () => void]);
  if (user.staff) menu.unshift(["shield", "Team admin", "Manage Turfie", () => router.push("/admin")] as [string, string, string, () => void]);

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.6fr", gap: 28, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 92, display: "flex", flexDirection: "column", gap: 18 }}>
            <Card tone="white" style={{ padding: 26, textAlign: "center", position: "relative" }}>
              <button onClick={() => router.push("/account/edit")} aria-label="Edit profile"
                style={{ position: "absolute", top: 16, right: 16, width: 38, height: 38, borderRadius: "50%", border: "1.5px solid var(--border-subtle)", background: "var(--color-canvas)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <Icon name="edit" size={17} color="var(--color-ink)" />
              </button>
              <Avatar initials={user.initials} size={84} src={user.photoUrl || null} style={{ margin: "0 auto 14px" }} />
              <Display size={26}>{user.fullName}</Display>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)", marginTop: 4 }}>{user.email}</div>
              <Badge variant="positive" style={{ marginTop: 12 }}>{user.level} player</Badge>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
                {[[played, "Games"], [hoursPlayed, "Hours"], [fav.length, "Saved"]].map(([n, l]) => (
                  <div key={l}><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>{n}</div><div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-mute)" }}>{l}</div></div>
                ))}
              </div>
            </Card>

            <Card tone="white" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "var(--radius-lg)", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="wallet" size={22} color="var(--color-ink-deep)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>Turfie wallet</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1.1 }}>{inr(user.walletBalance || 0)}</div>
                </div>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", margin: "12px 0 0", lineHeight: 1.4 }}>
                Use your balance at checkout. Eligible refunds can be credited here instantly.
              </p>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {steps.done < steps.total && (
              <Card tone="white" interactive onClick={() => router.push("/account/edit")} style={{ padding: 22, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative", width: 74, height: 74, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(var(--color-primary) ${profilePct}%, var(--border-subtle) ${profilePct}%)`, flexShrink: 0 }}>
                    <div style={{ background: "var(--color-canvas)", borderRadius: "50%", padding: 4 }}>
                      <Avatar initials={user.initials} size={56} src={user.photoUrl || null} />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, lineHeight: 1.1 }}>{user.fullName}</div>
                    {user.phone && <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", marginTop: 3 }}>{user.phone}</div>}
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700, color: "var(--color-ink-deep)", marginTop: 5 }}>{steps.done} / {steps.total} steps done</div>
                  </div>
                </div>
                <div style={{ height: 1, background: "var(--border-subtle)", margin: "18px 0" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.25 }}>Complete your profile, so we can surprise you on your special days!</span>
                  <span style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid var(--color-ink)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="arrowRight" size={18} /></span>
                </div>
              </Card>
            )}
            <Card tone="dark" style={{ padding: 26, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, bottom: -30, opacity: 0.16 }}><SportGlyph sport="football" size={170} color="var(--color-primary)" stroke={2} /></div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <Eyebrow color="var(--color-primary)" style={{ marginBottom: 8 }}>Welcome back</Eyebrow>
                <Display size={26} style={{ color: "#fff", marginBottom: 6 }}>Hey {user.name}, ready to play?</Display>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "rgba(255,255,255,.75)", margin: "0 0 16px" }}>You have {upcoming} upcoming {upcoming === 1 ? "game" : "games"}.</p>
                <Button size="sm" onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={16} />}>Book a turf</Button>
              </div>
            </Card>

            <div className="t-acct-menu" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {menu.map(([icon, title, sub, fn]) => (
                <button key={title} onClick={fn} style={{ textAlign: "left", cursor: "pointer", background: "var(--color-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "var(--radius-lg)", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={22} color="var(--color-ink-deep)" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15.5 }}>{title}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>{sub}</div>
                  </div>
                  <Icon name="arrowRight" size={18} color="var(--color-mute)" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button variant="tertiary" fullWidth onClick={async () => { await logout(); toast("Logged out"); router.push("/"); }} style={{ marginTop: 28, color: "var(--color-negative)" }}>Log out</Button>
      </Container>
    </div>
  );
}
