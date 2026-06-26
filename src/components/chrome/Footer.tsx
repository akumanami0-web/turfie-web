"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { Container } from "@/components/ui/layout-bits";
import { COMPANY } from "@/lib/content";

const COLS = [
  { h: "Play", links: [["Browse turfs", "/browse"], ["How it works", "/how"], ["Pricing", "/pricing"], ["My bookings", "/account/bookings"]] },
  { h: "Venues", links: [["List your turf", "/list"], ["Partner dashboard", "/admin"], ["Partner pricing", "/pricing"], ["Owner login", "/login"]] },
  { h: "Company", links: [["About us", "/about"], ["Help centre", "/help"], ["Contact us", "/contact"]] },
];

export function Footer() {
  const router = useRouter();
  return (
    <footer style={{ background: "var(--color-ink)", color: "var(--color-canvas-soft)", marginTop: 0 }}>
      <Container style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="t-foot-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40 }}>
          <div style={{ maxWidth: 320 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-light.svg" alt="Turfie" height={34} style={{ display: "block", marginBottom: 16 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.55, color: "rgba(255,255,255,.7)", margin: "0 0 20px" }}>
              Find a turf near you, pick a slot, split the cost with your squad, and play. Serving players across Maharashtra.
            </p>
            <Button size="sm" onClick={() => router.push("/browse")}>Find turfs near you</Button>
          </div>
          {COLS.map((c) => (
            <div key={c.h}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: 16 }}>{c.h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {c.links.map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "rgba(255,255,255,.72)", textDecoration: "none" }}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.12)", marginTop: 48, paddingTop: 24, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-body)", fontSize: 13.5, color: "rgba(255,255,255,.55)" }}>
          <span>© 2026 {COMPANY.legal} · {COMPANY.city}</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/help" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
            <Link href="/help" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
            <Link href="/contact" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
