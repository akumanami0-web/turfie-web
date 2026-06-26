"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Button } from "./primitives";
import { CourtArt, Display, Stars } from "./layout-bits";
import { Icon, SportGlyph } from "./Icon";
import { inr } from "@/lib/format";
import { SPORT_LABEL } from "@/lib/content";
import type { Turf } from "@/lib/types";

export function TurfCard({ turf, variant = "grid" }: { turf: Turf; variant?: "grid" | "list" }) {
  const router = useRouter();
  const t = turf;
  const go = () => router.push(`/turf/${t.id}`);
  const lowSpots = t.spotsLeft <= 3;

  const badge = (
    <Badge variant={lowSpots ? "warning" : "positive"} style={{ fontSize: 12 }}>
      {lowSpots ? `${t.spotsLeft} slots left` : "Available today"}
    </Badge>
  );

  const meta = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", color: "var(--color-body)", fontSize: 13.5, fontFamily: "var(--font-body)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="pin" size={15} color="var(--color-mute)" />{t.area}</span>
      <span style={{ color: "var(--border-subtle)" }}>·</span>
      <span>{t.distLabel}</span>
    </div>
  );

  const sportsRow = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {t.sports.map((s) => (
        <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, color: "var(--color-ink)", background: "var(--color-canvas-soft)", borderRadius: "var(--radius-pill)", padding: "4px 10px" }}>
          <SportGlyph sport={s} size={13} stroke={2.2} />{SPORT_LABEL[s] || s}
        </span>
      ))}
    </div>
  );

  if (variant === "list") {
    return (
      <Card tone="white" interactive padding={0} onClick={go} className="t-turf-list" style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "210px 1fr", cursor: "pointer" }}>
        <CourtArt sport={t.primary} height={"100%"} style={{ minHeight: 168 }} badge={badge} />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <Display as="h3" size={21} style={{ lineHeight: 1.16 }}>{t.name}</Display>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", marginTop: 7 }}>{t.kind}</div>
            </div>
            <Stars rating={t.rating} size={14} />
          </div>
          {meta}
          {sportsRow}
          <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{inr(t.price)}</span><span style={{ color: "var(--color-mute)", fontSize: 13, fontFamily: "var(--font-body)" }}> /hr</span></div>
            <Button size="sm" iconRight={<Icon name="arrowRight" size={16} />}>Book now</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card tone="white" interactive padding={0} onClick={go} style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", height: "100%" }}>
      <CourtArt sport={t.primary} height={170} badge={badge} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <Display as="h3" size={19} style={{ lineHeight: 1.08 }}>{t.name}</Display>
          <Stars rating={t.rating} size={13} />
        </div>
        {meta}
        {sportsRow}
        <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>{inr(t.price)}</span><span style={{ color: "var(--color-mute)", fontSize: 13, fontFamily: "var(--font-body)" }}> /hr</span></div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "var(--color-ink)" }}>Book <Icon name="arrowRight" size={15} /></span>
        </div>
      </div>
    </Card>
  );
}
