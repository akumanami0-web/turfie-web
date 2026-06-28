"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { Avatar, Container } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/components/providers/session";

const NAV_LINKS = [
  { href: "/browse", label: "Browse turfs" },
  { href: "/how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/list", label: "List your turf" },
  { href: "/help", label: "Help" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = (href: string) => pathname === href;
  const linkStyle = (a: boolean): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer", padding: "6px 2px",
    fontFamily: "var(--font-body)", fontSize: 15, fontWeight: a ? 700 : 600,
    color: a ? "var(--color-ink)" : "var(--color-body)",
    borderBottom: a ? "2px solid var(--color-primary)" : "2px solid transparent",
    textDecoration: "none",
  });

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 60, background: "var(--color-canvas)", borderBottom: solid ? "1px solid var(--border-subtle)" : "1px solid transparent", transition: "border-color 160ms ease" }}>
      <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, gap: 16 }}>
        <Link href="/" aria-label="Turfie home" style={{ display: "flex", alignItems: "center", padding: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="Turfie" height={34} style={{ display: "block" }} />
        </Link>

        <nav className="t-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} style={linkStyle(active(l.href))}>{l.label}</Link>
          ))}
        </nav>

        <div className="t-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <Link href="/account" style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar initials={user.initials} size={38} ring src={user.photoUrl || null} />
            </Link>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>Log in</Button>
          )}
          <Button size="sm" onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={16} />}>Find turfs</Button>
        </div>

        <button className="t-nav-mobile" onClick={() => setOpen((o) => !o)} aria-label="Menu" style={{ background: "var(--color-canvas-soft)", border: "none", cursor: "pointer", width: 44, height: 44, borderRadius: "50%", display: "none", placeItems: "center" }}>
          <Icon name={open ? "x" : "filter"} size={22} />
        </button>
      </Container>

      {open && (
        <div className="t-nav-mobile" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--color-canvas)", padding: "12px 0 20px" }}>
          <Container style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ textAlign: "left", padding: "13px 4px", fontFamily: "var(--font-body)", fontSize: 17, fontWeight: active(l.href) ? 700 : 600, color: "var(--color-ink)", borderBottom: "1px solid var(--border-subtle)", textDecoration: "none" }}>{l.label}</Link>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Button variant="tertiary" fullWidth onClick={() => { setOpen(false); router.push(user ? "/account" : "/login"); }}>{user ? "My account" : "Log in"}</Button>
              <Button fullWidth onClick={() => { setOpen(false); router.push("/browse"); }}>Find turfs</Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
