"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Stars, Avatar, CourtArt, SectionHead } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { GoogleMap } from "@/components/ui/Map";
import { useShare } from "@/components/providers/share";
import { useToast } from "@/components/providers/toast";
import { useFavourites } from "@/lib/useFavourites";
import { dirUrl } from "@/lib/maps";
import { inr } from "@/lib/format";
import type { Turf, Review } from "@/lib/types";

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: "50%", background: "var(--color-canvas)", border: "none",
  cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "var(--shadow-card)",
};

function AmenityPill({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--color-canvas-soft)", borderRadius: "var(--radius-pill)", padding: "8px 14px", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
      <Icon name="check" size={15} color="var(--color-positive)" /> {label}
    </span>
  );
}

export function CourtScreen({ turf: t, reviews }: { turf: Turf; reviews: Review[] }) {
  const router = useRouter();
  const share = useShare();
  const toast = useToast();
  const { isFav, toggle } = useFavourites();
  const [expanded, setExpanded] = useState(false);
  const fav = isFav(t.id);

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingBottom: 64 }}>
      <div style={{ position: "relative" }}>
        <CourtArt sport={t.primary} height={340} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(14,15,12,.18) 0%, transparent 30%, transparent 60%, rgba(14,15,12,.12) 100%)" }} />
        <Container style={{ position: "absolute", top: 20, left: 0, right: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => router.push("/browse")} aria-label="Back" style={iconBtn}><Icon name="arrowLeft" size={20} /></button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => share({ title: `${t.name} — book on Turfie`, subtitle: `${t.kind} · ${t.area}`, hash: "" })} aria-label="Share" style={iconBtn}><Icon name="share" size={19} /></button>
              <button onClick={() => { toggle(t.id); toast(fav ? "Removed from saved" : "Saved to your shortlist"); }} aria-label="Favourite" style={iconBtn}>
                <Icon name={fav ? "heartFill" : "heart"} size={20} color={fav ? "var(--color-negative)" : "var(--color-ink)"} />
              </button>
            </div>
          </div>
        </Container>
      </div>

      <Container style={{ marginTop: -40, position: "relative", zIndex: 2 }}>
        <div className="t-court-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr", gap: 28, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card tone="white" style={{ padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <Eyebrow style={{ marginBottom: 8 }}>{t.kind}</Eyebrow>
                  <Display size={34}>{t.name}</Display>
                </div>
                <Badge variant={t.spotsLeft <= 3 ? "warning" : "positive"}>{t.spotsLeft <= 3 ? `${t.spotsLeft} slots left today` : "Available today"}</Badge>
              </div>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16, color: "var(--color-body)", fontFamily: "var(--font-body)", fontSize: 15 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="pin" size={17} color="var(--color-mute)" /> {t.area} · {t.distLabel}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Stars rating={t.rating} size={15} /> <span style={{ color: "var(--color-mute)" }}>({t.reviews} reviews)</span></span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: "var(--color-body)", margin: "18px 0 0" }}>
                {expanded ? t.blurb : t.blurb.slice(0, 120) + (t.blurb.length > 120 ? "…" : "")}
                {t.blurb.length > 120 && (
                  <button onClick={() => setExpanded((e) => !e)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink)", fontWeight: 700, fontFamily: "var(--font-body)", fontSize: 15, marginLeft: 6 }}>{expanded ? "Show less" : "Read more"}</button>
                )}
              </p>
            </Card>

            <div className="t-stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[["compass", "Surface", t.surface], ["users", "Formats", t.formats.join(" · ")], ["clock", "Hours", t.openLabel]].map(([icon, label, val]) => (
                <div key={label} style={{ border: "1.5px solid var(--color-primary)", borderRadius: "var(--radius-lg)", padding: "16px 16px", background: "var(--color-canvas)" }}>
                  <Icon name={icon} size={20} color="var(--color-ink)" />
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-mute)", marginTop: 10 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--color-ink)", marginTop: 3 }}>{val}</div>
                </div>
              ))}
            </div>

            <Card tone="white" style={{ padding: 28 }}>
              <SectionHead title="Amenities" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {t.amenities.map((a) => <AmenityPill key={a} label={a} />)}
              </div>
            </Card>

            <Card tone="white" style={{ padding: 28 }}>
              <SectionHead title="Location" meta={<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="pin" size={14} color="var(--color-mute)" /> {t.area} · {t.pin}</span>} />
              <GoogleMap turf={t} height={280} />
              <a href={dirUrl(t)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, padding: "14px 16px", background: "var(--color-canvas-soft)", borderRadius: "var(--radius-lg)", textDecoration: "none" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Icon name="pin" size={18} color="var(--color-ink-deep)" />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--color-ink)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}, {t.area}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, color: "var(--color-ink)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5 }}>
                  Directions <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", display: "grid", placeItems: "center" }}><Icon name="arrowRight" size={17} color="var(--color-ink)" /></span>
                </span>
              </a>
            </Card>

            <Card tone="white" style={{ padding: 28 }}>
              <SectionHead title="Player reviews" meta={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Stars rating={t.rating} size={16} /> <span style={{ color: "var(--color-mute)" }}>· {t.reviews}</span></span>} />
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {reviews.map((r) => (
                  <div key={r.who} style={{ display: "flex", gap: 14 }}>
                    <Avatar initials={r.initials} size={42} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>{r.who}</span>
                        <Stars rating={r.rating} size={13} showNum={false} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>{r.whenLbl}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5, color: "var(--color-body)", margin: "6px 0 0" }}>{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ position: "sticky", top: 92 }}>
            <Card tone="white" style={{ padding: 24, border: "1px solid var(--color-ink)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34 }}>{inr(t.price)}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-mute)" }}>per hour</span>
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="users" size={15} color="var(--color-mute)" /> Split across your squad
              </div>
              <Button fullWidth size="lg" style={{ marginTop: 18 }} onClick={() => router.push(`/turf/${t.id}/book`)} iconRight={<Icon name="arrowRight" size={18} />}>
                Check availability
              </Button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "12px 14px", background: "var(--color-primary-pale)", borderRadius: "var(--radius-lg)" }}>
                <Icon name="shield" size={18} color="var(--color-ink-deep)" />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-ink-deep)", lineHeight: 1.4 }}>Your slot is held for 10 min at checkout. Free cancellation up to 24h.</span>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
