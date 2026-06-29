"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Chip } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, CourtArt } from "@/components/ui/layout-bits";
import { ModalShell } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/providers/toast";
import { inr } from "@/lib/format";
import { SPORT_LABEL } from "@/lib/content";
import type { TournamentView } from "@/lib/tournaments";

const DAY = 24 * 60 * 60 * 1000;

function statusBadge(s: string) {
  if (s === "live") return <Badge variant="brand">● Live now</Badge>;
  if (s === "completed") return <Badge variant="neutral">Completed</Badge>;
  return <Badge variant="positive">Upcoming</Badge>;
}

/** Ticks every second so countdowns stay live. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "0m";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

/** Returns the join/kickoff state for a battle from its startAt. */
function battleTiming(t: TournamentView, now: number) {
  if (!t.startAt || t.status === "completed") return { hasTimer: false, joinClosed: t.status === "completed", label: "", value: "" };
  const cutoff = t.startAt - DAY;
  if (now < cutoff) return { hasTimer: true, joinClosed: false, label: "Joining closes in", value: fmtCountdown(cutoff - now) };
  if (now < t.startAt) return { hasTimer: true, joinClosed: true, label: "Kicks off in", value: fmtCountdown(t.startAt - now) };
  return { hasTimer: true, joinClosed: true, label: "Kicked off", value: "" };
}

function BattleCard({ t, onJoin, onLeave, onPass }: { t: TournamentView; onJoin: (t: TournamentView) => void; onLeave: (t: TournamentView) => void; onPass: (t: TournamentView) => void }) {
  const isActive = t.status !== "completed" && !!t.startAt;
  const now = useNow(isActive);
  const timing = battleTiming(t, now);
  const full = t.entrants >= t.slots && !t.joined;
  const pct = Math.min(100, Math.round((t.entrants / Math.max(1, t.slots)) * 100));
  const sportLabel = SPORT_LABEL[t.sport] || t.sport;

  return (
    <Card tone="white" padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ position: "relative" }}>
        <CourtArt sport={t.sport} height={140} />
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          {statusBadge(t.status)}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.92)", color: "var(--color-ink)", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12 }}>
            <Icon name="trophy" size={13} color="var(--color-ink)" />{sportLabel}
          </span>
        </div>
        {t.prizePool && (
          <div style={{ position: "absolute", top: 12, right: 12, background: "var(--color-ink)", color: "var(--color-primary)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12.5 }}>
            🏆 {t.prizePool}
          </div>
        )}
        {t.joined && <div style={{ position: "absolute", bottom: 10, left: 12 }}><Badge variant="positive">✓ You&apos;re in</Badge></div>}
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

        {/* Live countdown timer */}
        {timing.hasTimer && timing.value && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, background: timing.joinClosed ? "var(--color-canvas-soft)" : "var(--color-primary-pale)", borderRadius: "var(--radius-md)", padding: "8px 12px" }}>
            <Icon name="clock" size={15} color={timing.joinClosed ? "var(--color-mute)" : "var(--color-ink-deep)"} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>{timing.label}</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, marginLeft: "auto", color: "var(--color-ink)", fontVariantNumeric: "tabular-nums" }}>{timing.value}</span>
          </div>
        )}

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
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => onLeave(t)}>Leave</Button>
              <Button size="sm" variant="primary" onClick={() => onPass(t)} iconLeft={<Icon name="navigation" size={15} />}>View pass</Button>
            </div>
          ) : timing.joinClosed ? (
            <Chip>Joining closed</Chip>
          ) : full ? (
            <Chip>Full</Chip>
          ) : (
            <Button size="sm" variant="primary" onClick={() => onJoin(t)}>Join battle</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", fontFamily: "var(--font-body)", fontSize: 14.5 }}>
      <span style={{ color: "var(--color-mute)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--color-ink)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function BattlesScreen({ tournaments, loggedIn }: { tournaments: TournamentView[]; loggedIn: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(tournaments);
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState<{ type: "join" | "leave"; t: TournamentView } | null>(null);
  const [busy, setBusy] = useState(false);

  const mineCount = list.filter((t) => t.joined && t.status !== "completed").length;
  const tabs: [string, string][] = [["all", "All"], ["live", "Live"], ["upcoming", "Upcoming"], ["completed", "Past"]];
  if (mineCount > 0) tabs.unshift(["mine", `Your battles (${mineCount})`]);

  const shown = list.filter((t) => {
    if (filter === "mine") return t.joined && t.status !== "completed";
    return filter === "all" || t.status === filter;
  });

  async function doConfirm() {
    if (!confirm) return;
    if (!loggedIn) { toast("Log in to join a battle", "warning"); router.push("/login"); return; }
    const { type, t } = confirm;
    setBusy(true);
    const res = await fetch(`/api/tournaments/${t.id}/join`, { method: type === "join" ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setConfirm(null);
    if (!res.ok) { toast(data.error || "Couldn't update", "error"); return; }
    const joined = type === "join";
    setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, joined, entrants: x.entrants + (joined ? 1 : -1) } : x)));
    toast(joined ? "You're in — see you on the pitch!" : "Left the battle");
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
            <Display size={22} style={{ marginBottom: 6 }}>{filter === "mine" ? "You haven't joined a battle yet" : `No battles ${filter !== "all" ? "here" : "yet"}`}</Display>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: 0 }}>New tournaments drop regularly — check back soon.</p>
          </div>
        ) : (
          <div className="t-card-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {shown.map((t) => <BattleCard key={t.id} t={t} onJoin={(b) => setConfirm({ type: "join", t: b })} onLeave={(b) => setConfirm({ type: "leave", t: b })} onPass={(b) => router.push(`/battle/${b.id}/pass`)} />)}
          </div>
        )}
      </Container>

      {confirm && (
        <ModalShell onClose={() => setConfirm(null)} maxWidth={460}>
          {confirm.type === "join" ? (
            <>
              <Eyebrow style={{ marginBottom: 6 }}>Join battle</Eyebrow>
              <Display size={24} style={{ marginBottom: 12 }}>{confirm.t.title}</Display>
              <div style={{ background: "var(--color-canvas-soft)", borderRadius: "var(--radius-lg)", padding: "8px 16px", marginBottom: 16 }}>
                <InfoRow label="Format" value={`${confirm.t.format}${confirm.t.subs > 0 ? ` · ${confirm.t.subs} subs` : ""}`} />
                <InfoRow label="Venue" value={confirm.t.area || confirm.t.address || "TBA"} />
                <InfoRow label="Date" value={confirm.t.dateLabel} />
                <InfoRow label="Time" value={confirm.t.time} />
                {confirm.t.prizePool && <InfoRow label="Prize pool" value={`🏆 ${confirm.t.prizePool}`} />}
                <InfoRow label="Teams in" value={`${confirm.t.entrants} / ${confirm.t.slots}`} />
                <InfoRow label="Entry" value={confirm.t.entryFee > 0 ? `${inr(confirm.t.entryFee)} (pay at venue)` : "Free"} />
              </div>
              {confirm.t.blurb && <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)", margin: "0 0 18px", lineHeight: 1.5 }}>{confirm.t.blurb}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="tertiary" fullWidth onClick={() => setConfirm(null)}>Cancel</Button>
                <Button fullWidth disabled={busy} onClick={doConfirm} iconRight={<Icon name="check" size={17} />}>{busy ? "Joining…" : "Confirm & join"}</Button>
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-warning-pale)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Icon name="x" size={28} color="var(--color-warning-deep)" stroke={2.6} />
              </div>
              <Display size={22} style={{ textAlign: "center", marginBottom: 8 }}>Leave this battle?</Display>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--color-body)", textAlign: "center", margin: "0 0 20px" }}>
                You&apos;ll give up your spot in <strong>{confirm.t.title}</strong>. You can re-join later if slots are still open.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="tertiary" fullWidth onClick={() => setConfirm(null)}>Stay in</Button>
                <Button fullWidth disabled={busy} onClick={doConfirm} style={{ background: "var(--color-warning-deep)", color: "#fff" }}>{busy ? "Leaving…" : "Leave battle"}</Button>
              </div>
            </>
          )}
        </ModalShell>
      )}
    </div>
  );
}
