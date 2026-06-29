"use client";
import React, { useMemo, useState } from "react";
import { Button, Card, Badge, Chip, Input } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { useToast } from "@/components/providers/toast";
import { inr, inrK } from "@/lib/format";
import { SPORTS } from "@/lib/content";
import type { TournamentView } from "@/lib/tournaments";

type SUser = { id: string; name: string; email: string; phone: string | null; role: string; phoneVerified: boolean; joined: string; bookings: number; initials: string };
type SBooking = { id: string; who: string; turf: string; dateLabel: string; time: string; price: number; status: string };
type STurf = { id: string; name: string; area: string; ownerId: string | null };
type Kpis = { players: number; bookings: number; revenue: number; tournaments: number };

const labelCss: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: 6, display: "block" };
const cell: React.CSSProperties = { padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-body)", textAlign: "left" };
const th: React.CSSProperties = { ...cell, fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--color-mute)" };

function statusBadge(s: string) {
  if (s === "upcoming" || s === "live") return <Badge variant="positive">{s}</Badge>;
  if (s === "cancelled") return <Badge variant="negative">cancelled</Badge>;
  return <Badge variant="neutral">{s}</Badge>;
}

export function StaffScreen({ meName, kpis, users: users0, bookings: bookings0, turfs: turfs0, tournaments: tours0 }: {
  meName: string; kpis: Kpis; users: SUser[]; bookings: SBooking[]; turfs: STurf[]; tournaments: TournamentView[];
}) {
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState(users0);
  const [bookings, setBookings] = useState(bookings0);
  const [turfs, setTurfs] = useState(turfs0);
  const [tours, setTours] = useState(tours0);
  const [q, setQ] = useState("");

  const tabs: [string, string][] = [["overview", "Overview"], ["players", "Players"], ["vendors", "Vendors & turfs"], ["bookings", "Bookings"], ["battles", "Battles"]];
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  async function setRole(u: SUser, role: string) {
    const res = await fetch(`/api/staff/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    if (!res.ok) { toast("Couldn't update role", "error"); return; }
    setUsers((p) => p.map((x) => (x.id === u.id ? { ...x, role } : x)));
    toast(`${u.name} is now ${role === "operator" ? "a vendor" : role}`);
  }

  async function assignTurf(turfId: string, ownerId: string | null) {
    const body = ownerId ? { assignTurfId: turfId } : { unassignTurfId: turfId };
    const target = ownerId || turfs.find((t) => t.id === turfId)?.ownerId;
    if (!target) return;
    const res = await fetch(`/api/staff/users/${target}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { toast("Couldn't assign turf", "error"); return; }
    setTurfs((p) => p.map((t) => (t.id === turfId ? { ...t, ownerId } : t)));
    toast(ownerId ? "Turf assigned" : "Turf unassigned");
  }

  async function cancelBooking(b: SBooking) {
    const res = await fetch(`/api/staff/bookings/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    if (!res.ok) { toast("Couldn't cancel", "error"); return; }
    setBookings((p) => p.map((x) => (x.id === b.id ? { ...x, status: "cancelled" } : x)));
    toast("Booking cancelled & refunded");
  }

  const operators = users.filter((u) => u.role === "operator");

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 28, paddingBottom: 64 }}>
      <Container wide>
        <Eyebrow style={{ marginBottom: 6 }}>Turfie team</Eyebrow>
        <Display size={34} style={{ marginBottom: 4 }}>Admin dashboard</Display>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-body)", margin: "0 0 22px" }}>Welcome back, {meName}. Manage players, bookings, vendors and battles.</p>

        {/* KPIs */}
        <div className="t-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[["Players", String(kpis.players), "users"], ["Bookings", String(kpis.bookings), "calendar"], ["Revenue", inrK(kpis.revenue), "wallet"], ["Battles", String(kpis.tournaments), "shield"]].map(([l, v, ic]) => (
            <Card key={l} tone="white" style={{ padding: 20 }}>
              <Icon name={ic} size={20} color="var(--color-ink-deep)" />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginTop: 10 }}>{v}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>{l}</div>
            </Card>
          ))}
        </div>

        <div className="t-scroll-x" style={{ display: "flex", gap: 10, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map(([id, label]) => <Chip key={id} selected={tab === id} onClick={() => setTab(id)}>{label}</Chip>)}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>Latest bookings</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead><tr>{["Player", "Turf", "When", "Amount", "Status"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {bookings.slice(0, 10).map((b) => (
                    <tr key={b.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td style={cell}>{b.who}</td><td style={cell}>{b.turf}</td>
                      <td style={cell}>{b.dateLabel} · {b.time}</td><td style={{ ...cell, fontWeight: 700, color: "var(--color-ink)" }}>{inr(b.price)}</td>
                      <td style={cell}>{statusBadge(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* PLAYERS */}
        {tab === "players" && (
          <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--border-subtle)" }}>
              <Input placeholder="Search by name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} prefix={<Icon name="search" size={18} color="var(--color-mute)" />} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead><tr>{["Player", "Contact", "Joined", "Bookings", "Role", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.filter((u) => { const s = q.toLowerCase().trim(); return !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone || "").includes(s); }).map((u) => (
                    <tr key={u.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td style={cell}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar initials={u.initials} size={32} /><span style={{ fontWeight: 700, color: "var(--color-ink)" }}>{u.name}</span></div></td>
                      <td style={cell}>{u.email}<div style={{ fontSize: 12.5, color: "var(--color-mute)" }}>{u.phone || "—"}{u.phoneVerified ? " ✓" : ""}</div></td>
                      <td style={cell}>{u.joined}</td>
                      <td style={cell}>{u.bookings}</td>
                      <td style={cell}><Badge variant={u.role === "staff" ? "brand" : u.role === "operator" ? "ink" : "neutral"}>{u.role}</Badge></td>
                      <td style={{ ...cell, textAlign: "right" }}>
                        {u.role !== "staff" && (u.role === "operator"
                          ? <Button size="sm" variant="ghost" onClick={() => setRole(u, "player")}>Make player</Button>
                          : <Button size="sm" variant="tertiary" onClick={() => setRole(u, "operator")}>Make vendor</Button>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* VENDORS & TURFS */}
        {tab === "vendors" && (
          <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>Turf assignments</div>
            {operators.length === 0 && (
              <div style={{ padding: 18, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)" }}>No vendor accounts yet. Make a player a vendor in the Players tab first.</div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {turfs.map((t) => {
                const owner = t.ownerId ? userById.get(t.ownerId) : null;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)" }}>{t.area}{owner ? ` · ${owner.name}` : " · unassigned"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 200 }}>
                        <Dropdown value={t.ownerId || ""} onChange={(v) => assignTurf(t.id, v || null)} placeholder="Assign vendor…"
                          options={[{ value: "", label: "Unassigned" }, ...operators.map((o) => ({ value: o.id, label: o.name }))]} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* BOOKINGS */}
        {tab === "bookings" && (
          <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead><tr>{["ID", "Player", "Turf", "When", "Amount", "Status", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td style={{ ...cell, fontWeight: 700, color: "var(--color-ink)" }}>{b.id}</td>
                      <td style={cell}>{b.who}</td><td style={cell}>{b.turf}</td>
                      <td style={cell}>{b.dateLabel} · {b.time}</td><td style={cell}>{inr(b.price)}</td>
                      <td style={cell}>{statusBadge(b.status)}</td>
                      <td style={{ ...cell, textAlign: "right" }}>{b.status !== "cancelled" && <Button size="sm" variant="ghost" onClick={() => cancelBooking(b)}>Cancel</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* BATTLES */}
        {tab === "battles" && <BattlesAdmin tours={tours} setTours={setTours} turfs={turfs} />}
      </Container>
    </div>
  );
}

function BattlesAdmin({ tours, setTours, turfs }: { tours: TournamentView[]; setTours: React.Dispatch<React.SetStateAction<TournamentView[]>>; turfs: STurf[] }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: "", sport: "football", format: "5v5", area: "", dateLabel: "", time: "", slots: "16", prizePool: "", blurb: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function create() {
    if (!form.title.trim()) { toast("Add a title", "warning"); return; }
    setBusy(true);
    const res = await fetch("/api/staff/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, slots: Number(form.slots) }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't create", "error"); return; }
    const t = data.tournament;
    setTours((p) => [{ id: t.id, title: t.title, sport: t.sport, format: t.format, turfId: t.turfId, area: t.area, dateLabel: t.dateLabel, dateKey: t.dateKey, time: t.time, slots: t.slots, entryFee: t.entryFee, prizePool: t.prizePool, status: t.status, blurb: t.blurb, entrants: 0, joined: false }, ...p]);
    setForm({ title: "", sport: "football", format: "5v5", area: "", dateLabel: "", time: "", slots: "16", prizePool: "", blurb: "" });
    toast("Battle created");
  }

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/staff/tournaments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) { toast("Couldn't update", "error"); return; }
    setTours((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
  }
  async function remove(id: string) {
    const res = await fetch(`/api/staff/tournaments/${id}`, { method: "DELETE" });
    if (!res.ok) { toast("Couldn't delete", "error"); return; }
    setTours((p) => p.filter((t) => t.id !== id));
    toast("Battle deleted");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }} className="t-admin-grid">
      <Card tone="white" style={{ padding: 22 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, margin: "0 0 16px" }}>Create a battle</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><span style={labelCss}>Title</span><Input placeholder="Sunday 5v5 Showdown" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="t-form-2">
            <div><span style={labelCss}>Sport</span><Dropdown value={form.sport} onChange={(v) => set("sport", v)} options={SPORTS.map((s) => ({ value: s.id, label: s.label }))} /></div>
            <div><span style={labelCss}>Format</span><Input placeholder="5v5" value={form.format} onChange={(e) => set("format", e.target.value)} /></div>
          </div>
          <div><span style={labelCss}>Venue / area</span><Dropdown value={form.area} onChange={(v) => set("area", v)} placeholder="Pick area" options={[{ value: "", label: "Any" }, ...Array.from(new Set(turfs.map((t) => t.area))).map((a) => ({ value: a, label: a }))]} /></div>
          <div className="t-form-2">
            <div><span style={labelCss}>Date</span><Input placeholder="Sat, 12 Jul" value={form.dateLabel} onChange={(e) => set("dateLabel", e.target.value)} /></div>
            <div><span style={labelCss}>Time</span><Input placeholder="4 PM – 8 PM" value={form.time} onChange={(e) => set("time", e.target.value)} /></div>
          </div>
          <div className="t-form-2">
            <div><span style={labelCss}>Team slots</span><Input type="number" value={form.slots} onChange={(e) => set("slots", e.target.value)} /></div>
            <div><span style={labelCss}>Prize pool</span><Input placeholder="₹10,000" value={form.prizePool} onChange={(e) => set("prizePool", e.target.value)} /></div>
          </div>
          <div><span style={labelCss}>Description</span><Input placeholder="Knockout format, referees provided…" value={form.blurb} onChange={(e) => set("blurb", e.target.value)} /></div>
          <Button fullWidth disabled={busy} onClick={create} iconRight={<Icon name="arrowRight" size={17} />}>{busy ? "Creating…" : "Create battle"}</Button>
        </div>
      </Card>

      <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>All battles ({tours.length})</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {tours.length === 0 && <div style={{ padding: 18, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)" }}>No battles yet — create one.</div>}
          {tours.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>{t.title}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>{t.format} · {t.dateLabel} · {t.entrants}/{t.slots} teams</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 150 }}>
                  <Dropdown value={t.status} onChange={(v) => setStatus(t.id, v)} options={[{ value: "upcoming", label: "Upcoming" }, { value: "live", label: "Live" }, { value: "completed", label: "Completed" }]} />
                </div>
                <button onClick={() => remove(t.id)} aria-label="Delete" style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid var(--border-subtle)", background: "var(--color-canvas)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={16} color="var(--color-negative)" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
