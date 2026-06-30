"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar, Stars } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { TurfCard } from "@/components/ui/TurfCard";
import { WeatherBanner } from "@/components/ui/WeatherBanner";
import { SPORTS, FEATURES, STEPS, TESTIMONIALS, AREAS } from "@/lib/content";
import { nextDays } from "@/lib/format";
import type { Turf } from "@/lib/types";

function HeroWidget() {
  const router = useRouter();
  const [sport, setSport] = useState("football");
  const days = nextDays(30);
  const [when, setWhen] = useState(days[0].key);
  const [area, setArea] = useState("mumbai");
  const labelStyle: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)", marginBottom: 7, display: "block" };
  return (
    <Card tone="white" style={{ border: "1px solid var(--color-ink)", padding: 24, width: "100%", maxWidth: 420 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <Icon name="zap" size={18} color="var(--color-ink)" />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase", whiteSpace: "nowrap" }}>Find a turf</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Sport</label>
          <Dropdown value={sport} onChange={setSport} icon={<SportGlyph sport={sport} size={17} stroke={2.2} />} options={SPORTS.map((s) => ({ value: s.id, label: s.label }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
          <div>
            <label style={labelStyle}>When</label>
            <Dropdown value={when} onChange={setWhen} options={days.map((d) => ({ value: d.key, label: d.label }))} />
          </div>
          <div>
            <label style={labelStyle}>Area</label>
            <Dropdown value={area} onChange={setArea} options={AREAS} />
          </div>
        </div>
        <Button fullWidth size="lg" onClick={() => { try { localStorage.setItem("turfie.searchDate", when); } catch {} router.push(`/browse?sport=${sport}`); }} iconRight={<Icon name="arrowRight" size={18} />}>Search turfs</Button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>
          <Icon name="shield" size={15} color="var(--color-positive)" /> Slot held 10 min · free cancellation
        </div>
      </div>
    </Card>
  );
}

export function HomeScreen({ popular }: { popular: Turf[] }) {
  const router = useRouter();
  const stats = (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
      {[["120+", "turfs listed"], ["60 sec", "to book"], ["4.8★", "avg rating"]].map(([n, l]) => (
        <div key={l}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, lineHeight: 1, whiteSpace: "nowrap" }}>{n}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)", marginTop: 6 }}>{l}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "var(--color-canvas-soft)", paddingTop: 48, paddingBottom: 64 }}>
        <Container>
          <div className="t-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
            <div>
              <Badge variant="ink" style={{ marginBottom: 22 }}><Icon name="pin" size={14} /> Now live across Maharashtra</Badge>
              <Display as="h1" size={48} style={{ lineHeight: 1.1, paddingBottom: "0.06em" }}>
                Real grass,<br />real goals —<br />booked in<br />seconds
              </Display>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 19, lineHeight: 1.5, color: "var(--color-body)", maxWidth: 460, margin: "20px 0 28px" }}>
                Find a football pitch, box-cricket net or pickleball court near you — 5, 7, 9 or 11-a-side. Pick a slot, split the cost with your squad, and play.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
                <Button size="lg" onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={18} />}>Find turfs near you</Button>
                <Button size="lg" variant="tertiary" onClick={() => router.push("/how")}>How it works</Button>
              </div>
              {stats}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}><HeroWidget /></div>
          </div>
        </Container>
      </section>

      {/* Weather — below the turf finder */}
      <section style={{ background: "var(--color-canvas)", paddingTop: 24 }}>
        <WeatherBanner />
      </section>

      {/* Feature strip */}
      <section style={{ background: "var(--color-canvas)", padding: "64px 0" }}>
        <Container>
          <div className="t-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div style={{ width: 52, height: 52, borderRadius: "var(--radius-lg)", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", marginBottom: 16 }}>
                  <Icon name={f.icon} size={24} color="var(--color-ink-deep)" />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, textTransform: "uppercase", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Popular near you */}
      <section style={{ background: "var(--color-canvas-soft)", padding: "64px 0" }}>
        <Container>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
            <div>
              <Eyebrow style={{ marginBottom: 10 }}>Popular near you</Eyebrow>
              <Display size={40}>Turfs players love</Display>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={16} />}>See all turfs</Button>
          </div>
          <div className="t-card-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {popular.map((t) => <TurfCard key={t.id} turf={t} />)}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how" style={{ background: "var(--color-canvas)", padding: "72px 0" }}>
        <Container>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Eyebrow style={{ marginBottom: 12 }}>How it works</Eyebrow>
            <Display size={44} style={{ maxWidth: 620, margin: "0 auto" }}>From group chat to kick-off in three taps</Display>
          </div>
          <div className="t-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {STEPS.map((s) => (
              <Card key={s.n} tone="sage" style={{ padding: 28 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, color: "var(--color-primary)", WebkitTextStroke: "1.5px var(--color-ink)", lineHeight: 1, marginBottom: 18 }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, textTransform: "uppercase", margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{s.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section style={{ background: "var(--color-canvas-soft)", padding: "64px 0" }}>
        <Container>
          <Display size={40} style={{ marginBottom: 32 }}>Loved by squads & venues</Display>
          <div className="t-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <Card key={t.who} tone="white" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 16 }}>
                <Stars rating={5} size={16} showNum={false} />
                <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.55, color: "var(--color-ink)", margin: 0, flex: 1 }}>“{t.text}”</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar initials={t.initials} size={42} />
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>{t.who}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>{t.area}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA band */}
      <section style={{ background: "var(--color-canvas)", padding: "64px 0 80px" }}>
        <Container>
          <Card tone="dark" style={{ padding: "56px 48px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, bottom: -50, opacity: 0.16 }}>
              <SportGlyph sport="football" size={300} color="var(--color-primary)" stroke={2} />
            </div>
            <div className="t-cta-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "center", position: "relative", zIndex: 1 }}>
              <div>
                <Display size={44} style={{ color: "var(--color-primary)", marginBottom: 16 }}>Your squad is waiting. Book the turf.</Display>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 18, lineHeight: 1.5, color: "rgba(255,255,255,.8)", margin: 0, maxWidth: 460 }}>
                  Join thousands of players booking pitches and courts across Maharashtra.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Button size="lg" fullWidth onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={18} />}>Find turfs near you</Button>
                <Button size="lg" fullWidth variant="ghost" onClick={() => router.push("/list")} style={{ color: "var(--color-primary)", border: "1px solid rgba(255,255,255,.3)" }}>List your turf</Button>
              </div>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
}
