"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { useFavourites } from "@/lib/useFavourites";
import type { Booking } from "@/lib/types";

export function AccountScreen({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const { user, logout } = useSession();
  const toast = useToast();
  const { fav } = useFavourites();
  if (!user) return null;

  const upcoming = bookings.filter((b) => b.status === "upcoming").length;
  const refundCount = bookings.filter((b) => b.status === "cancelled").length;
  const played = bookings.filter((b) => b.status === "completed").length || 32;

  const menu: [string, string, string, () => void][] = [
    ["calendar", "My bookings", `${upcoming} upcoming`, () => router.push("/account/bookings")],
    ["refresh", "Refunds", refundCount ? `${refundCount} tracked` : "Track refunds", () => router.push("/account/refunds")],
    ["heart", "Saved turfs", `${fav.length} saved`, () => router.push("/account/saved")],
    ["compass", "Payment methods", "UPI · Card · Wallet", () => toast("Payments coming soon")],
    ["shield", "Privacy & security", "Password, data", () => toast("Settings coming soon")],
    ["users", "My squad", "Invite friends", () => toast("Squad coming soon")],
  ];

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.6fr", gap: 28, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 92, display: "flex", flexDirection: "column", gap: 18 }}>
            <Card tone="white" style={{ padding: 26, textAlign: "center" }}>
              <Avatar initials={user.initials} size={84} style={{ margin: "0 auto 14px" }} />
              <Display size={26}>{user.fullName}</Display>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)", marginTop: 4 }}>{user.email}</div>
              <Badge variant="positive" style={{ marginTop: 12 }}>{user.level} player</Badge>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
                {[[played, "Games"], [played * 2, "Hours"], [fav.length, "Saved"]].map(([n, l]) => (
                  <div key={l}><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>{n}</div><div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-mute)" }}>{l}</div></div>
                ))}
              </div>
            </Card>
            <Button variant="tertiary" fullWidth onClick={async () => { await logout(); toast("Logged out"); router.push("/"); }}>Log out</Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
      </Container>
    </div>
  );
}
