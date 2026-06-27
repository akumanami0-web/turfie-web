import React from "react";
import { Container } from "./layout-bits";

type CSS = React.CSSProperties;

/** Shimmer block. */
export function Skel({ w = "100%", h = 16, r = 8, style = {} }: { w?: number | string; h?: number | string; r?: number; style?: CSS }) {
  return <div className="t-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** White card matching <Card tone="white">. */
function Card({ children, pad = 22, style = {} }: { children?: React.ReactNode; pad?: number; style?: CSS }) {
  return (
    <div style={{ background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", padding: pad, ...style }}>
      {children}
    </div>
  );
}

/** Page shell — soft canvas, same paddings as the real screens. */
function Page({ children, wide = false, pad = 32 }: { children: React.ReactNode; wide?: boolean; pad?: number }) {
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: pad, paddingBottom: 64 }}>
      <Container wide={wide}>{children}</Container>
    </div>
  );
}

/** Eyebrow + Display heading placeholder. */
function Head({ display = 300, dispH = 40, sub = false }: { display?: number; dispH?: number; sub?: boolean }) {
  return (
    <div style={{ marginBottom: sub ? 12 : 24 }}>
      <Skel w={92} h={12} style={{ marginBottom: 12 }} />
      <Skel w={display} h={dispH} r={10} style={{ marginBottom: sub ? 14 : 0 }} />
      {sub && <><Skel w="70%" h={14} style={{ marginBottom: 7 }} /><Skel w="48%" h={14} /></>}
    </div>
  );
}

/** Filter chips strip. */
function Chips({ widths = [56, 84, 92, 88] }: { widths?: number[] }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
      {widths.map((w, i) => <Skel key={i} w={w} h={38} r={999} />)}
    </div>
  );
}

/** One turf card — matches <TurfCard variant="grid">. */
function TurfCardGrid() {
  return (
    <div style={{ background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Skel w="100%" h={170} r={0} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <Skel w="58%" h={20} /><Skel w={64} h={15} />
        </div>
        <Skel w="46%" h={14} />
        <div style={{ display: "flex", gap: 6 }}>
          <Skel w={72} h={24} r={999} /><Skel w={64} h={24} r={999} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Skel w={84} h={22} /><Skel w={58} h={15} />
        </div>
      </div>
    </div>
  );
}

/** One turf card — matches <TurfCard variant="list">. */
function TurfCardList() {
  return (
    <div className="t-turf-list" style={{ background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", overflow: "hidden", display: "grid", gridTemplateColumns: "210px 1fr" }}>
      <Skel w="100%" h="100%" r={0} style={{ minHeight: 168 }} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}><Skel w="60%" h={22} style={{ marginBottom: 8 }} /><Skel w="32%" h={13} /></div>
          <Skel w={70} h={15} />
        </div>
        <Skel w="44%" h={14} />
        <div style={{ display: "flex", gap: 6 }}>
          <Skel w={72} h={24} r={999} /><Skel w={64} h={24} r={999} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: 6 }}>
          <Skel w={96} h={24} /><Skel w={108} h={38} r={999} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Saved ─────────────────────────── */
export function SavedSkeleton() {
  return (
    <Page>
      <Head display={240} dispH={40} />
      <div className="t-card-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => <TurfCardGrid key={i} />)}
      </div>
    </Page>
  );
}

/* ─────────────────────────── Browse ─────────────────────────── */
export function BrowseSkeleton() {
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh" }}>
      <div style={{ background: "var(--color-canvas)", borderBottom: "1px solid var(--border-subtle)", paddingTop: 28, paddingBottom: 20 }}>
        <Container wide>
          <Skel w={150} h={12} style={{ marginBottom: 12 }} />
          <Skel w={320} h={38} r={10} style={{ marginBottom: 18 }} />
          <Skel w="100%" h={48} r={999} style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", gap: 10 }}>
            {[56, 92, 84, 96, 80].map((w, i) => <Skel key={i} w={w} h={38} r={999} />)}
          </div>
        </Container>
      </div>
      <Container wide style={{ paddingTop: 24, paddingBottom: 64 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <Skel w={140} h={18} /><Skel w={168} h={20} />
        </div>
        <div className="t-browse-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {Array.from({ length: 4 }).map((_, i) => <TurfCardList key={i} />)}
          </div>
          <Skel h={560} r={24} style={{ position: "sticky", top: 92 }} />
        </div>
      </Container>
    </div>
  );
}

/* ─────────────────────────── My bookings ─────────────────────────── */
function BookingRowSkel() {
  return (
    <div style={{ background: "var(--color-canvas)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-card)", overflow: "hidden", display: "grid", gridTemplateColumns: "120px 1fr" }}>
      <Skel w="100%" h="100%" r={0} style={{ minHeight: 120 }} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}><Skel w="70%" h={19} style={{ marginBottom: 7 }} /><Skel w="45%" h={13} /></div>
          <Skel w={74} h={24} r={999} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Skel w={90} h={14} /><Skel w={110} h={14} /><Skel w={70} h={14} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: 8 }}>
          <Skel w={70} h={20} />
          <div style={{ display: "flex", gap: 8 }}><Skel w={72} h={34} r={999} /><Skel w={104} h={34} r={999} /></div>
        </div>
      </div>
    </div>
  );
}

export function BookingsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Page>
      <Head display={260} dispH={40} />
      <Chips />
      <div className="t-bookings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {Array.from({ length: rows }).map((_, i) => <BookingRowSkel key={i} />)}
      </div>
    </Page>
  );
}

/* ─────────────────────────── Refunds ─────────────────────────── */
function RefundCardSkel() {
  return (
    <Card pad={0} style={{ overflow: "hidden" }}>
      <div style={{ padding: "20px 22px", display: "flex", gap: 14, alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
        <Skel w={52} h={52} r={12} />
        <div style={{ flex: 1 }}><Skel w="50%" h={18} style={{ marginBottom: 8 }} /><Skel w="70%" h={13} /></div>
        <div style={{ textAlign: "right" }}><Skel w={80} h={20} style={{ marginBottom: 6, marginLeft: "auto" }} /><Skel w={70} h={20} r={999} style={{ marginLeft: "auto" }} /></div>
      </div>
      <div style={{ padding: "22px 22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Skel w={44} h={44} r={999} /><Skel w={52} h={12} />
            </div>
          ))}
        </div>
        <Skel w="100%" h={64} r={16} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skel w={140} h={14} />
          <div style={{ display: "flex", gap: 8 }}><Skel w={86} h={34} r={999} /><Skel w={78} h={34} r={999} /></div>
        </div>
      </div>
    </Card>
  );
}

export function RefundsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Page>
      <Skel w={88} h={20} style={{ marginBottom: 12 }} />
      <Head display={300} dispH={40} sub />
      <div className="t-refund-summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "var(--color-ink)", borderRadius: "var(--radius-xl)", padding: 22 }}>
          <Skel w={110} h={13} style={{ marginBottom: 14 }} /><Skel w={120} h={30} r={8} style={{ marginBottom: 6 }} /><Skel w={150} h={13} />
        </div>
        <div style={{ background: "var(--color-primary-pale)", borderRadius: "var(--radius-xl)", padding: 22 }}>
          <Skel w={110} h={13} style={{ marginBottom: 14 }} /><Skel w={120} h={30} r={8} style={{ marginBottom: 6 }} /><Skel w={120} h={13} />
        </div>
      </div>
      <Chips widths={[56, 96, 92]} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {Array.from({ length: rows }).map((_, i) => <RefundCardSkel key={i} />)}
      </div>
      <Card pad={22} style={{ marginTop: 24, display: "flex", gap: 14 }}>
        <Skel w={20} h={20} r={6} />
        <div style={{ flex: 1 }}><Skel w={160} h={15} style={{ marginBottom: 10 }} /><Skel w="100%" h={13} style={{ marginBottom: 6 }} /><Skel w="92%" h={13} /></div>
      </Card>
    </Page>
  );
}

/* ─────────────────────────── Account ─────────────────────────── */
export function AccountSkeleton() {
  return (
    <Page>
      <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.6fr", gap: 28, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card pad={26} style={{ textAlign: "center" }}>
            <Skel w={84} h={84} r={999} style={{ margin: "0 auto 14px" }} />
            <Skel w={170} h={26} r={8} style={{ margin: "0 auto 8px" }} />
            <Skel w={190} h={14} style={{ margin: "0 auto 12px" }} />
            <Skel w={96} h={24} r={999} style={{ margin: "0 auto" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><Skel w={28} h={24} /><Skel w={40} h={12} /></div>
              ))}
            </div>
          </Card>
          <Skel w="100%" h={48} r={999} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Skel w="100%" h={186} r={24} />
          <div className="t-acct-menu" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "var(--color-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
                <Skel w={46} h={46} r={16} />
                <div style={{ flex: 1 }}><Skel w="70%" h={16} style={{ marginBottom: 8 }} /><Skel w="50%" h={13} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ─────────────────────────── Court detail ─────────────────────────── */
export function CourtSkeleton() {
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingBottom: 64 }}>
      <Skel w="100%" h={340} r={0} />
      <Container style={{ marginTop: -40, position: "relative" }}>
        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr", gap: 28, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card pad={28}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div><Skel w={120} h={12} style={{ marginBottom: 10 }} /><Skel w={220} h={32} r={10} /></div>
                <Skel w={120} h={26} r={999} />
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 16 }}><Skel w={150} h={15} /><Skel w={130} h={15} /></div>
              <Skel w="100%" h={14} style={{ marginTop: 18 }} /><Skel w="85%" h={14} style={{ marginTop: 8 }} />
            </Card>
            <div className="t-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-lg)", padding: 16, background: "var(--color-canvas)" }}>
                  <Skel w={22} h={22} r={6} style={{ marginBottom: 10 }} /><Skel w="60%" h={11} style={{ marginBottom: 6 }} /><Skel w="80%" h={14} />
                </div>
              ))}
            </div>
            <Card pad={28}><Skel w={120} h={18} style={{ marginBottom: 16 }} /><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{[100, 120, 90, 110, 80].map((w, i) => <Skel key={i} w={w} h={36} r={999} />)}</div></Card>
            <Card pad={28}><Skel w={120} h={18} style={{ marginBottom: 16 }} /><Skel w="100%" h={280} r={16} /></Card>
          </div>
          <div style={{ position: "sticky", top: 92 }}>
            <Card pad={24} style={{ border: "1px solid var(--color-ink)" }}>
              <Skel w={140} h={34} r={10} style={{ marginBottom: 8 }} />
              <Skel w={180} h={14} style={{ marginBottom: 18 }} />
              <Skel w="100%" h={52} r={999} style={{ marginBottom: 16 }} />
              <Skel w="100%" h={56} r={16} />
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
