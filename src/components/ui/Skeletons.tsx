import React from "react";
import { Container } from "./layout-bits";

type CSS = React.CSSProperties;

/** Shimmer block. */
export function Skel({ w = "100%", h = 16, r = 8, style = {} }: { w?: number | string; h?: number | string; r?: number; style?: CSS }) {
  return <div className="t-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function Card({ children, style = {} }: { children?: React.ReactNode; style?: CSS }) {
  return (
    <div style={{ background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", padding: 22, ...style }}>
      {children}
    </div>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 24 }}>
      <Skel w={90} h={12} style={{ marginBottom: 12 }} />
      <Skel w={260} h={34} r={10} />
    </div>
  );
}

/** Refunds / My bookings — a couple of summary cards + stacked rows. */
export function ListPageSkeleton({ rows = 3, summary = false }: { rows?: number; summary?: boolean }) {
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <Header />
        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }} className="t-refund-summary">
            <Card style={{ height: 110 }}><Skel w={120} h={14} /><Skel w={90} h={28} r={10} style={{ marginTop: 16 }} /></Card>
            <Card style={{ height: 110 }}><Skel w={120} h={14} /><Skel w={90} h={28} r={10} style={{ marginTop: 16 }} /></Card>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          {[64, 88, 96].map((w, i) => <Skel key={i} w={w} h={36} r={999} />)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <Card key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Skel w={56} h={56} r={12} />
              <div style={{ flex: 1 }}>
                <Skel w="55%" h={18} style={{ marginBottom: 10 }} />
                <Skel w="35%" h={13} />
              </div>
              <Skel w={70} h={24} r={999} />
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}

/** Saved / Browse — a grid of cards. */
export function GridPageSkeleton({ cards = 6, cols = 3 }: { cards?: number; cols?: number }) {
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <Header />
        <div className="t-card-grid-4" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20 }}>
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} style={{ background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
              <Skel w="100%" h={170} r={0} />
              <div style={{ padding: 18 }}>
                <Skel w="70%" h={20} style={{ marginBottom: 12 }} />
                <Skel w="50%" h={13} style={{ marginBottom: 14 }} />
                <Skel w="40%" h={20} />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

/** Account — sticky profile card + menu grid. */
export function AccountSkeleton() {
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.6fr", gap: 28, alignItems: "start" }}>
          <Card style={{ textAlign: "center", padding: 26 }}>
            <Skel w={84} h={84} r={999} style={{ margin: "0 auto 14px" }} />
            <Skel w={160} h={24} r={8} style={{ margin: "0 auto 8px" }} />
            <Skel w={180} h={13} style={{ margin: "0 auto" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 22 }}>
              {[0, 1, 2].map((i) => <Skel key={i} h={40} />)}
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Skel w="100%" h={150} r={24} />
            <div className="t-acct-menu" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skel key={i} h={86} r={24} />)}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Court detail — hero + content cards. */
export function CourtSkeleton() {
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingBottom: 64 }}>
      <Skel w="100%" h={340} r={0} />
      <Container style={{ marginTop: -40, position: "relative" }}>
        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr", gap: 28, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card><Skel w={140} h={12} style={{ marginBottom: 12 }} /><Skel w="60%" h={30} r={10} style={{ marginBottom: 16 }} /><Skel w="90%" h={14} style={{ marginBottom: 8 }} /><Skel w="80%" h={14} /></Card>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>{[0, 1, 2].map((i) => <Skel key={i} h={96} r={16} />)}</div>
            <Card><Skel w={120} h={18} style={{ marginBottom: 14 }} /><Skel w="100%" h={60} /></Card>
          </div>
          <Skel h={260} r={24} style={{ position: "sticky", top: 92 }} />
        </div>
      </Container>
    </div>
  );
}
