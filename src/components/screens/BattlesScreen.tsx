"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, CourtArt } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/providers/toast";
import { inr } from "@/lib/format";
import type { TournamentView } from "@/lib/tournaments";

function statusBadge(s: string) {
  if (s === "live") return <Badge variant="brand">● Live now</Badge>;
  if (s === "completed") return <Badge variant="neutral">Completed</Badge>;
  return <Badge variant="positive">Upcoming</Badge>;
}

function BattleCard({ t, loggedIn, onChange }: { t: TournamentView; loggedIn: boolean; onChange: (id: string, joined: boolean, entrants: number) => void }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const full = t.entrants >= t.slots && !t.joined;
  const pct = Math.min(100, Math.round((t.entrants / Math.max(1, t.slots)) * 100));

  async function toggle() {
    if (!loggedIn) { toast("Log in to join a battle", "warning"); router.push("/login"); return; }
    setBusy(true);
    const res = await fetch(`/api/tournaments/${t.id}/join`, { method: t.joined ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't update", "error"); return; }
    const joined = !t.joined;
    onChange(t.id, joined, t.entrants + (joined ? 1 : -1));
    toast(joined ? "You're in — see you on the pitch!" : "Left the battle");
  }

  return (
    <Card tone="white" padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ position: "relative" }}>
        <CourtArt sport={t.sport} height={140} />
        <div style={{ position: "absolute", top: 12, left: 12 }}>{statusBadge(t.status)}</div>
        {t.prizePool && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "var(--color-ink)", color: "var(--color-primary)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12.5 }}>
            🏆 {t.prizePool}
          </div>
        )}
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{t.title}</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="users" size={15} color="var(--color-mute)" />{t.format}{t.subs > 0 ? ` · ${t.subs} subs` : ""}</span>
          {(t.area || t.address) && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={15} color="var(--color-mute)" />{t.area || t.address}</span>}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-body)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="calendar" size={15} color="var(--color-mute)" />{t.dateLabel}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="clock" size={15} color="var(--color-mute)" />{t.time}</span>
        </div>
        {t.blurb && <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", margin: "2px 0 0", lineHeight: 1.45 }}>{t.blurb}</p>}

        {/* slots */}
        <div style={{ marginTop: 6 }}>
          <div style={{ height: 7, borderRadius: 999, background: "var(--color-canvas-soft)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-primary)" }} />
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)", marginTop: 6 }}>{t.entrants} / {t.slots} teams in</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto", paddingTop: 12 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17 }}>{t.entryFee > 0 ? inr(t.entryFee) : "Free entry"}</span>
          {t.status === "completed" ? (
            <Chip>Ended</Chip>
          ) : t.joined ? (
            <Button size="sm" variant="tertiary" disabled={busy} onClick={toggle} iconLeft={<Icon name="check" size={15} />}>{busy ? "…" : "Joined"}</Button>
          ) : full ? (
            <Chip>Full</Chip>
          ) : (
            <Button size="sm" variant="primary" disabled={busy} onClick={toggle}>{busy ? "…" : "Join battle"}</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function BattlesScreen({ tournaments, loggedIn }: { tournaments: TournamentView[]; loggedIn: boolean }) {
  const [list, setList] = useState(tournaments);
  const [filter, setFilter] = useState("all");
  const tabs: [string, string][] = [["all", "All"], ["live", "Live"], ["upcoming", "Upcoming"], ["completed", "Past"]];
  const shown = list.filter((t) => filter === "all" || t.status === filter);

  function onChange(id: string, joined: boolean, entrants: number) {
    setList((prev) => prev.map((t) => (t.id === id ? { ...t, joined, entrants } : t)));
  }

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <Eyebrow style={{ marginBottom: 8 }}>Turfie Battles</Eyebrow>
        <Display size={38} style={{ marginBottom: 8 }}>Join a battle</Display>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-body)", margin: "0 0 22px", maxWidth: 560 }}>
          Tournaments and weekend battles run by the Turfie team. Rally your squad, claim the prize, and earn bragging rights.
        </p>

        <div className="t-scroll-x" style={{ display: "flex", gap: 10, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map(([id, label]) => <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>{label}</Chip>)}
        </div>

        {shown.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "var(--color-primary-pale)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Icon name="users" size={32} color="var(--color-ink-deep)" />
            </div>
            <Display size={22} style={{ marginBottom: 6 }}>No battles {filter !== "all" ? "here" : "yet"}</Display>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: 0 }}>New tournaments drop regularly — check back soon.</p>
          </div>
        ) : (
          <div className="t-card-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {shown.map((t) => <BattleCard key={t.id} t={t} loggedIn={loggedIn} onChange={onChange} />)}
          </div>
        )}
      </Container>
    </div>
  );
}
