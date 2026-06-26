"use client";
import React, { useState } from "react";
import { Button, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { TurfCard } from "@/components/ui/TurfCard";
import { GoogleMap } from "@/components/ui/Map";
import { SPORTS } from "@/lib/content";
import { haversineKm } from "@/lib/maps";
import { useGeo } from "@/lib/useGeo";
import { useToast } from "@/components/providers/toast";
import type { Turf } from "@/lib/types";

export function BrowseScreen({ turfs, initialSport = "all" }: { turfs: Turf[]; initialSport?: string }) {
  const toast = useToast();
  const geo = useGeo(toast);
  const [sport, setSport] = useState(initialSport);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("distance");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);

  const withDist = turfs.map((t) => {
    const km = geo.coords ? haversineKm(geo.coords, { lat: t.lat, lng: t.lng }) : null;
    return km != null ? { ...t, distLabel: `${km.toFixed(1)} km`, _km: km } : { ...t, _km: parseFloat(t.distLabel) };
  });

  let list = withDist.filter((t) => {
    if (sport !== "all" && !t.sports.includes(sport as Turf["sports"][number])) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!(t.name.toLowerCase().includes(s) || t.area.toLowerCase().includes(s) || t.sports.some((sp) => sp.includes(s)))) return false;
    }
    return true;
  });
  list = [...list].sort((a, b) => {
    if (sort === "price") return a.price - b.price;
    if (sort === "rating") return b.rating - a.rating;
    return (a._km || 0) - (b._km || 0);
  });

  const filterChips = [{ id: "all", label: "All" }, ...SPORTS];
  const active = turfs.find((t) => t.id === activeId) || list[0];

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh" }}>
      <div style={{ background: "var(--color-canvas)", borderBottom: "1px solid var(--border-subtle)", paddingTop: 28, paddingBottom: 20 }}>
        <Container wide>
          <Eyebrow style={{ marginBottom: 8 }}><Icon name="pin" size={13} /> Across Maharashtra</Eyebrow>
          <Display size={36} style={{ marginBottom: 18 }}>Browse turfs near you</Display>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 10, background: "var(--color-canvas)", border: "1.5px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", padding: "12px 18px" }}>
              <Icon name="search" size={20} color="var(--color-mute)" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search turf, area or sport…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-ink)", minWidth: 0 }} />
            </div>
            <Button variant="tertiary" size="sm" className="t-map-toggle" onClick={() => setShowMapMobile((v) => !v)} iconLeft={<Icon name="navigation" size={16} />} style={{ display: "none" }}>
              {showMapMobile ? "Show list" : "Show map"}
            </Button>
          </div>
          <div className="t-scroll-x" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {filterChips.map((s) => (
              <Chip key={s.id} selected={sport === s.id} onClick={() => setSport(s.id)} iconLeft={s.id !== "all" ? <SportGlyph sport={s.id} size={15} stroke={2.2} color={sport === s.id ? "var(--color-canvas)" : "var(--color-ink)"} /> : null}>
                {s.label}
              </Chip>
            ))}
          </div>
          {geo.status !== "granted" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16, padding: "12px 16px", background: "var(--color-primary-pale)", borderRadius: "var(--radius-lg)" }}>
              <Icon name="navigation" size={18} color="var(--color-ink-deep)" />
              <span style={{ flex: 1, minWidth: 180, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-ink-deep)" }}>
                {geo.status === "denied" ? "Location is off. Turn it on to see turfs nearest you." : "Turn on location for turfs nearest you — sorted by real distance."}
              </span>
              <Button size="sm" onClick={geo.request} iconLeft={<Icon name="navigation" size={15} />}>{geo.status === "loading" ? "Locating…" : "Use my location"}</Button>
            </div>
          )}
          {geo.status === "granted" && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--color-positive-deep)" }}>
              <Icon name="check" size={15} color="var(--color-positive)" /> Showing turfs near your location
            </div>
          )}
        </Container>
      </div>

      <Container wide style={{ paddingTop: 24, paddingBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "var(--color-body)" }}>
            <strong style={{ color: "var(--color-ink)" }}>{list.length}</strong> {list.length === 1 ? "turf" : "turfs"} available
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)" }}>
            <Icon name="sliders" size={16} /> Sort
            <div style={{ width: 168 }}>
              <Dropdown value={sort} onChange={setSort} align="right" options={[{ value: "distance", label: "Nearest" }, { value: "price", label: "Lowest price" }, { value: "rating", label: "Top rated" }]} />
            </div>
          </label>
        </div>

        <div className="t-browse-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>
          <div className={`t-browse-list ${showMapMobile ? "t-hide-mobile" : ""}`} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {list.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--color-mute)" }}>
                <Icon name="search" size={36} color="var(--color-mute)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: "var(--font-body)", fontSize: 16 }}>No turfs match. Try another sport or area.</div>
              </div>
            )}
            {list.map((t) => (
              <div key={t.id} onMouseEnter={() => setActiveId(t.id)} className="t-list-row">
                <TurfCard turf={t} variant="list" />
              </div>
            ))}
          </div>
          <div className={`t-browse-map ${showMapMobile ? "" : "t-hide-mobile"}`} style={{ position: "sticky", top: 92 }}>
            <GoogleMap turf={active} query={list.length ? undefined : "sports turf Nalasopara"} label={active?.name} height={560} zoom={14} />
            {activeId && active && (
              <div style={{ marginTop: 14 }}>
                <TurfCard turf={active} variant="list" />
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
