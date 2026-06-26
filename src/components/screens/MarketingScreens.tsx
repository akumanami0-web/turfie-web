"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Input } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { useToast } from "@/components/providers/toast";
import { PLANS, FEATURES, STEPS, FAQ, COMPANY } from "@/lib/content";
import { inr } from "@/lib/format";

function PageHero({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <section style={{ background: "var(--color-canvas-soft)", paddingTop: 56, paddingBottom: 48 }}>
      <Container>
        <div style={{ maxWidth: 720 }}>
          <Eyebrow style={{ marginBottom: 12 }}>{eyebrow}</Eyebrow>
          <Display as="h1" size={56} style={{ marginBottom: 18 }}>{title}</Display>
          {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: 19, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{sub}</p>}
          {children}
        </div>
      </Container>
    </section>
  );
}

/* ── FAQ ── */
function FaqItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 17, color: "var(--color-ink)" }}>{item.q}</span>
        <Icon name={open ? "minus" : "plus"} size={22} color="var(--color-ink)" />
      </button>
      {open && <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, lineHeight: 1.6, color: "var(--color-body)", margin: "0 0 20px", maxWidth: 720 }}>{item.a}</p>}
    </div>
  );
}
export function FaqBand({ items }: { items?: { q: string; a: string }[] }) {
  return (
    <section style={{ background: "var(--color-canvas-soft)", padding: "64px 0" }}>
      <Container style={{ maxWidth: 860 }}>
        <Display size={36} style={{ marginBottom: 24, textAlign: "center" }}>Frequently asked</Display>
        <div>{(items || FAQ).map((f) => <FaqItem key={f.q} item={f} />)}</div>
      </Container>
    </section>
  );
}

/* ── How it works ── */
export function HowScreen() {
  const router = useRouter();
  return (
    <div>
      <PageHero eyebrow="How it works" title="From group chat to kick-off in three taps" sub="Turfie does the legwork so your squad can just play. Here's how a booking works." />
      <section style={{ background: "var(--color-canvas)", padding: "64px 0" }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {STEPS.map((s, i) => (
              <Card key={s.n} tone={i === 1 ? "pale" : "white"} className="t-how-row" style={{ padding: 32, display: "grid", gridTemplateColumns: "90px 1fr", gap: 24, alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 56, color: "var(--color-ink)", lineHeight: 1 }}>{s.n}</div>
                <div>
                  <Display as="h3" size={26} style={{ marginBottom: 8 }}>{s.title}</Display>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{s.body}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="t-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 48 }}>
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div style={{ width: 52, height: 52, borderRadius: "var(--radius-lg)", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", marginBottom: 14 }}><Icon name={f.icon} size={24} color="var(--color-ink-deep)" /></div>
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase", margin: "0 0 6px" }}>{f.title}</h4>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Button size="lg" onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={18} />}>Find turfs near you</Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ── Pricing ── */
export function PricingScreen() {
  const router = useRouter();
  return (
    <div>
      <PageHero eyebrow="Pricing" title="Free to play. Worth it to belong." sub="Booking is always free for players. Upgrade for perks, or list your turf to start earning." />
      <section style={{ background: "var(--color-canvas)", padding: "56px 0 40px" }}>
        <Container>
          <div className="t-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
            {PLANS.map((p) => {
              const dark = p.tone === "dark", green = p.tone === "green";
              const tone = dark ? "dark" : green ? "pale" : "white";
              return (
                <Card key={p.id} tone={tone as "dark" | "pale" | "white"} style={{ padding: 30, display: "flex", flexDirection: "column", gap: 6, border: dark ? "none" : "1px solid var(--border-subtle)", position: "relative", transform: dark ? "scale(1.03)" : "none" }}>
                  {p.tag && <Badge variant="positive" style={{ position: "absolute", top: 20, right: 20 }}>{p.tag}</Badge>}
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, textTransform: "uppercase", margin: 0, color: dark ? "#fff" : "var(--color-ink)" }}>{p.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "8px 0 4px" }}>
                    {p.price === null ? (
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: dark ? "#fff" : "var(--color-ink)" }}>Earn</span>
                    ) : (
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, color: dark ? "var(--color-primary)" : "var(--color-ink)" }}>{p.price === 0 ? "₹0" : inr(p.price)}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: dark ? "rgba(255,255,255,.7)" : "var(--color-mute)", marginBottom: 4 }}>{p.period}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: dark ? "rgba(255,255,255,.8)" : "var(--color-body)", margin: "0 0 18px" }}>{p.sub}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 24 }}>
                    {p.features.map((f) => (
                      <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <Icon name="check" size={18} color={dark ? "var(--color-primary)" : "var(--color-positive)"} stroke={2.4} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: dark ? "rgba(255,255,255,.9)" : "var(--color-body)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button fullWidth size="lg" variant={dark ? "primary" : "tertiary"} style={{ marginTop: "auto" }} onClick={() => router.push(p.id === "venue" ? "/list" : "/browse")}>{p.cta}</Button>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>
      <FaqBand items={FAQ.slice(0, 3)} />
    </div>
  );
}

/* ── List your turf ── */
export function ListScreen() {
  const [sent, setSent] = useState(false);
  const stats = [["0%", "setup cost"], ["24h", "to go live"], ["+38%", "avg. slot fill"]];
  return (
    <div>
      <section style={{ background: "var(--color-ink)", paddingTop: 56, paddingBottom: 56, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, bottom: -60, opacity: 0.14 }}><SportGlyph sport="football" size={340} color="var(--color-primary)" stroke={2} /></div>
        <Container>
          <div className="t-list-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 40, alignItems: "center", position: "relative", zIndex: 1 }}>
            <div>
              <Eyebrow color="var(--color-primary)" style={{ marginBottom: 12 }}>For turf owners</Eyebrow>
              <Display as="h1" size={56} style={{ color: "#fff", marginBottom: 18 }}>List your turf. Fill every slot.</Display>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 19, lineHeight: 1.5, color: "rgba(255,255,255,.8)", margin: "0 0 28px", maxWidth: 460 }}>
                Put your pitch in front of thousands of players across Maharashtra. Real-time calendar, online payments, zero setup cost.
              </p>
              <div style={{ display: "flex", gap: 32 }}>
                {stats.map(([n, l]) => (
                  <div key={l}><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "var(--color-primary)" }}>{n}</div><div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,.7)", marginTop: 4 }}>{l}</div></div>
                ))}
              </div>
            </div>
            <Card tone="white" style={{ padding: 26 }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-primary)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Icon name="check" size={30} color="var(--color-ink)" stroke={2.6} /></div>
                  <Display size={24} style={{ marginBottom: 8 }}>Thanks — we&apos;ll be in touch</Display>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: 0 }}>Our team onboards new venues within 24 working hours.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, textTransform: "uppercase", margin: 0 }}>Get listed free</h3>
                  <Input label="Venue name" placeholder="e.g. Green Field Arena" />
                  <div className="t-form-2">
                    <Input label="City" placeholder="e.g. Mumbai" />
                    <Input label="Phone" placeholder="+91 …" />
                  </div>
                  <Input label="Email" placeholder="you@venue.com" />
                  <Button type="submit" fullWidth size="lg" iconRight={<Icon name="arrowRight" size={18} />}>Request a call back</Button>
                </form>
              )}
            </Card>
          </div>
        </Container>
      </section>
      <section style={{ background: "var(--color-canvas)", padding: "64px 0" }}>
        <Container>
          <Display size={36} style={{ marginBottom: 32, textAlign: "center" }}>Everything you need to run your venue</Display>
          <div className="t-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[["calendar", "Live calendar", "Manage every slot in real time. No double bookings, ever."], ["compass", "Online payments", "Players pay upfront; you get fast, reliable payouts."], ["zap", "Dynamic pricing", "Peak and off-peak rates to fill quiet hours."], ["users", "Player reach", "Thousands of local players already booking on Turfie."]].map(([icon, t, b]) => (
              <Card key={t} tone="sage" style={{ padding: 24 }}>
                <div style={{ width: 50, height: 50, borderRadius: "var(--radius-lg)", background: "var(--color-canvas)", display: "grid", placeItems: "center", marginBottom: 14 }}><Icon name={icon} size={24} /></div>
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase", margin: "0 0 6px" }}>{t}</h4>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{b}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ── About ── */
export function AboutScreen() {
  const router = useRouter();
  const values: [string, string, string][] = [
    ["pin", "Local first", "We started in the Mumbai suburbs because that’s where we play — now we’re live across Maharashtra. Every venue is one we’d book ourselves."],
    ["users", "Built for squads", "Sport is social. Splitting the cost and rallying the group chat should be effortless."],
    ["shield", "Fair to everyone", "Transparent pricing for players, honest payouts for venues. No hidden fees."],
  ];
  return (
    <div>
      <PageHero eyebrow="About Turfie" title="We're on a mission to get more people playing" sub="Turfie began with a simple frustration: booking a turf near home meant a dozen phone calls and an advance to the manager. So we built a better way." />
      <section style={{ background: "var(--color-canvas)", padding: "56px 0" }}>
        <Container>
          <div className="t-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 56 }}>
            {values.map(([icon, t, b]) => (
              <Card key={t} tone="white" style={{ padding: 28 }}>
                <div style={{ width: 52, height: 52, borderRadius: "var(--radius-lg)", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", marginBottom: 16 }}><Icon name={icon} size={24} color="var(--color-ink-deep)" /></div>
                <Display as="h3" size={22} style={{ marginBottom: 8 }}>{t}</Display>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{b}</p>
              </Card>
            ))}
          </div>
          <Card tone="dark" style={{ padding: "48px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -40, opacity: 0.14 }}><SportGlyph sport="cricket" size={260} color="var(--color-primary)" stroke={2} /></div>
            <div className="t-feat-grid" style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
              {[["120+", "turfs listed"], ["15k+", "games played"], ["25+", "cities served"], ["4.8★", "avg rating"]].map(([n, l]) => (
                <div key={l}><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, color: "var(--color-primary)" }}>{n}</div><div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,.75)", marginTop: 4 }}>{l}</div></div>
              ))}
            </div>
          </Card>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Button size="lg" onClick={() => router.push("/browse")} iconRight={<Icon name="arrowRight" size={18} />}>Find turfs near you</Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ── Help ── */
export function HelpScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const items = FAQ.filter((f) => !q.trim() || f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase()));
  const topics: [string, string, string][] = [["zap", "Booking", "Slots, payments, confirmations"], ["users", "Squad & split", "Sharing the cost"], ["shield", "Cancellations", "Refunds & policy"], ["pin", "Venues", "Listing your turf"]];
  return (
    <div>
      <PageHero eyebrow="Help centre" title="How can we help?">
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-canvas)", border: "1.5px solid var(--color-ink)", borderRadius: "var(--radius-pill)", padding: "14px 20px", marginTop: 24, maxWidth: 520 }}>
          <Icon name="search" size={20} color="var(--color-mute)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 16 }} />
        </div>
      </PageHero>
      <section style={{ background: "var(--color-canvas)", padding: "48px 0 16px" }}>
        <Container>
          <div className="t-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {topics.map(([icon, t, b]) => (
              <Card key={t} tone="sage" interactive style={{ padding: 22, cursor: "pointer" }} onClick={() => router.push("/contact")}>
                <Icon name={icon} size={24} />
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "uppercase", margin: "12px 0 4px" }}>{t}</h4>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)", margin: 0 }}>{b}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
      <section style={{ background: "var(--color-canvas)", padding: "24px 0 64px" }}>
        <Container style={{ maxWidth: 860 }}>
          <Display size={28} style={{ marginBottom: 12 }}>Common questions</Display>
          <div>{items.map((f) => <FaqItem key={f.q} item={f} />)}</div>
          {items.length === 0 && <p style={{ fontFamily: "var(--font-body)", color: "var(--color-mute)", padding: "20px 0" }}>No articles match. Try “booking” or “cancellation”.</p>}
          <Card tone="pale" style={{ padding: 28, marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <Display size={22} style={{ marginBottom: 4 }}>Still stuck?</Display>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: 0 }}>Our team replies within a couple of hours.</p>
            </div>
            <Button size="lg" onClick={() => router.push("/contact")} iconRight={<Icon name="arrowRight" size={18} />}>Contact us</Button>
          </Card>
        </Container>
      </section>
    </div>
  );
}

/* ── Contact ── */
export function ContactScreen() {
  const router = useRouter();
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const channels: [string, string, string, string, string | null][] = [
    ["zap", "Chat", "Mon–Sun, 8am–11pm", "Start chat", null],
    ["compass", "Email", COMPANY.email, "Email us", `mailto:${COMPANY.email}`],
    ["users", "Call", COMPANY.phone, "Call now", COMPANY.phoneDial],
  ];
  return (
    <div>
      <PageHero eyebrow="Contact us" title="Talk to a human" sub="Questions about a booking, a refund, or listing your turf? We're here." />
      <section style={{ background: "var(--color-canvas)", padding: "56px 0 64px" }}>
        <Container>
          <div className="t-list-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 32, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {channels.map(([icon, t, sub, cta, href]) => (
                <Card key={t} tone="white" style={{ padding: 22, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "var(--radius-lg)", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={22} color="var(--color-ink-deep)" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 16 }}>{t}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)" }}>{sub}</div>
                  </div>
                  <Button size="sm" variant="tertiary" onClick={() => {
                    if (!href) { toast("Connecting…"); return; }
                    if (href.startsWith("tel:")) { window.location.href = href; return; }
                    toast("Connecting…"); setTimeout(() => { window.location.href = href; }, 600);
                  }}>{cta}</Button>
                </Card>
              ))}
              <Card tone="sage" style={{ padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><Icon name="pin" size={18} /><span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>Head office</span></div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--color-body)", margin: 0 }}>{COMPANY.legal}<br />{COMPANY.city}, India</p>
              </Card>
            </div>
            <Card tone="white" style={{ padding: 28 }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "36px 0" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-primary)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Icon name="check" size={30} color="var(--color-ink)" stroke={2.6} /></div>
                  <Display size={24} style={{ marginBottom: 8 }}>Message sent</Display>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: "0 0 18px" }}>We&apos;ll reply to your email within a couple of hours.</p>
                  <Button onClick={() => router.push("/")}>Back home</Button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Display size={24} style={{ marginBottom: 4 }}>Send us a message</Display>
                  <div className="t-form-2">
                    <Input label="Name" placeholder="Your name" />
                    <Input label="Email" placeholder="you@email.com" />
                  </div>
                  <Input label="Subject" placeholder="How can we help?" />
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--color-ink)", marginBottom: 6 }}>Message</span>
                    <textarea rows={5} placeholder="Tell us a bit more…" style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--color-ink)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 15, resize: "vertical", outline: "none" }} />
                  </label>
                  <Button type="submit" fullWidth size="lg" iconRight={<Icon name="arrowRight" size={18} />}>Send message</Button>
                </form>
              )}
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}
