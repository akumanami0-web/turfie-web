"use client";
import React, { useMemo, useState } from "react";
import { Button, Card, Badge, Chip, Input } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/toast";
import { inr, inrK, fmtDateShort } from "@/lib/format";
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
  const [detailId, setDetailId] = useState<string | null>(null);

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
        {tab === "players" && (() => {
          const s = q.toLowerCase().trim();
          const filtered = users.filter((u) => !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone || "").includes(s));
          return (
            <Card tone="white" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: "1px solid var(--border-subtle)" }}>
                <Input placeholder="Search by name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} prefix={<Icon name="search" size={18} color="var(--color-mute)" />} />
              </div>
              {filtered.length === 0 && <div style={{ padding: 18, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-mute)" }}>No players found.</div>}
              {filtered.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <Avatar initials={u.initials} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                        {u.role !== "player" && <Badge variant={u.role === "staff" ? "brand" : "ink"} style={{ fontSize: 11 }}>{u.role === "operator" ? "vendor" : u.role}</Badge>}
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="tertiary" onClick={() => setDetailId(u.id)} style={{ flexShrink: 0 }}>Details</Button>
                </div>
              ))}
            </Card>
          );
        })()}

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

        {detailId && (
          <PlayerModal
            userId={detailId}
            onClose={() => setDetailId(null)}
            onRole={(id, role) => setUsers((p) => p.map((x) => (x.id === id ? { ...x, role } : x)))}
          />
        )}
      </Container>
    </div>
  );
}

/* ── Player details popup ── */
type PlayerDetail = { id: string; name: string; email: string; phone: string | null; phoneVerified: boolean; role: string; city: string; level: string; gender: string | null; birthday: string | null; initials: string; photoUrl: string | null; joined: string };
type PlayerBooking = { id: string; turf: string; when: string; status: string; price: number };

function PlayerModal({ userId, onClose, onRole }: { userId: string; onClose: () => void; onRole: (id: string, role: string) => void }) {
  const toast = useToast();
  const [d, setD] = useState<PlayerDetail | null>(null);
  const [bookings, setBookings] = useState<PlayerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    let off = false;
    fetch(`/api/staff/users/${userId}`).then((r) => r.json()).then((data) => {
      if (off) return;
      setD(data.user || null); setBookings(data.bookings || []); setLoading(false);
    }).catch(() => setLoading(false));
    return () => { off = true; };
  }, [userId]);

  async function setRole(role: string) {
    if (!d) return;
    setBusy(true);
    const res = await fetch(`/api/staff/users/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    setBusy(false);
    if (!res.ok) { toast("Couldn't update role", "error"); return; }
    setD({ ...d, role });
    onRole(d.id, role);
    toast(role === "operator" ? "Now a vendor" : `Now ${role}`);
  }

  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const history = bookings.filter((b) => b.status !== "upcoming");

  return (
    <ModalShell onClose={onClose} maxWidth={480}>
      {loading || !d ? (
        <div style={{ padding: "30px 0", textAlign: "center", fontFamily: "var(--font-body)", color: "var(--color-mute)" }}>Loading…</div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <Avatar initials={d.initials} size={56} src={d.photoUrl || null} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>{d.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)", overflow: "hidden", textOverflow: "ellipsis" }}>{d.email}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[["Phone", d.phone ? d.phone + (d.phoneVerified ? " ✓" : "") : "—"], ["Joined", d.joined], ["City", d.city], ["Level", d.level], ["Gender", d.gender || "—"], ["Birthday", d.birthday || "—"]].map(([l, v]) => (
              <div key={l}><div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--color-mute)" }}>{l}</div><div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>{v}</div></div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <Badge variant={d.role === "staff" ? "brand" : d.role === "operator" ? "ink" : "neutral"}>{d.role === "operator" ? "vendor" : d.role}</Badge>
            {d.role !== "staff" && (d.role === "operator"
              ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => setRole("player")}>Make player</Button>
              : <Button size="sm" variant="tertiary" disabled={busy} onClick={() => setRole("operator")}>Make vendor</Button>)}
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            <BookingGroup title={`Upcoming (${upcoming.length})`} rows={upcoming} />
            <BookingGroup title={`History (${history.length})`} rows={history} />
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function BookingGroup({ title, rows }: { title: string; rows: PlayerBooking[] }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--color-mute)", marginBottom: 6 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)" }}>None.</div>
      ) : rows.map((b) => (
        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14 }}>{b.turf}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>{b.id} · {b.when}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14 }}>{inr(b.price)}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: b.status === "cancelled" ? "var(--color-negative)" : "var(--color-mute)" }}>{b.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = { title: "", sport: "football", format: "5v5", area: "", turfId: "", address: "", dateKey: "", time: "", slots: "16", subs: "0", prizePool: "", blurb: "" };

function BattlesAdmin({ tours, setTours, turfs }: { tours: TournamentView[]; setTours: React.Dispatch<React.SetStateAction<TournamentView[]>>; turfs: STurf[] }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<TournamentView | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const today = new Date().toISOString().slice(0, 10);
  const areas = useMemo(() => Array.from(new Set(turfs.map((t) => t.area))).sort(), [turfs]);
  const areaTurfs = useMemo(() => turfs.filter((t) => !form.area || t.area === form.area), [turfs, form.area]);
  const customVenue = !form.turfId; // no listed turf chosen → use a custom address

  async function create() {
    if (!form.title.trim()) { toast("Add a title", "warning"); return; }
    if (!form.dateKey) { toast("Pick a date", "warning"); return; }
    setBusy(true);
    const dateLabel = fmtDateShort(new Date(`${form.dateKey}T00:00:00`));
    const payload = { ...form, dateLabel, slots: Number(form.slots), subs: Number(form.subs), turfId: form.turfId || null, address: form.turfId ? null : form.address };
    const res = await fetch("/api/staff/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't create", "error"); return; }
    const t = data.tournament;
    setTours((p) => [{ id: t.id, title: t.title, sport: t.sport, format: t.format, turfId: t.turfId, area: t.area, address: t.address, dateLabel: t.dateLabel, dateKey: t.dateKey, time: t.time, slots: t.slots, subs: t.subs, entryFee: t.entryFee, prizePool: t.prizePool, status: t.status, blurb: t.blurb, entrants: 0, joined: false }, ...p]);
    setForm(EMPTY_FORM);
    toast("Battle created");
  }

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/staff/tournaments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) { toast("Couldn't update", "error"); return; }
    setTours((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
  }
  async function remove() {
    if (!confirmDel) return;
    const id = confirmDel.id;
    const res = await fetch(`/api/staff/tournaments/${id}`, { method: "DELETE" });
    setConfirmDel(null);
    if (!res.ok) { toast("Couldn't delete", "error"); return; }
    setTours((p) => p.filter((t) => t.id !== id));
    toast("Battle deleted");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }} className="t-admin-grid">
      <Card tone="white" style={{ padding: 22 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, margin: "0 0 16px" }}>Create a battle</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><span style={labelCss}>Title</span><Input placeholder="Sunday Knockout" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="t-form-2">
            <div><span style={labelCss}>Sport</span><Dropdown value={form.sport} onChange={(v) => set("sport", v)} options={SPORTS.map((s) => ({ value: s.id, label: s.label }))} /></div>
            <div><span style={labelCss}>Format</span><Dropdown value={form.format} onChange={(v) => set("format", v)} options={[{ value: "5v5", label: "5 v 5" }, { value: "7v7", label: "7 v 7" }, { value: "9v9", label: "9 v 9" }, { value: "11v11", label: "11 v 11" }]} /></div>
          </div>

          {/* city/area → turf → address */}
          <div><span style={labelCss}>City / area</span><Dropdown value={form.area} onChange={(v) => setForm((f) => ({ ...f, area: v, turfId: "" }))} placeholder="Select area" options={[{ value: "", label: "Select area" }, ...areas.map((a) => ({ value: a, label: a }))]} /></div>
          <div>
            <span style={labelCss}>Turf</span>
            <Dropdown value={form.turfId} onChange={(v) => set("turfId", v)} placeholder="Select a turf"
              options={[...areaTurfs.map((t) => ({ value: t.id, label: t.name })), { value: "", label: "Other / custom address" }]} />
          </div>
          {customVenue && (
            <div><span style={labelCss}>Venue address</span><Input placeholder="e.g. Ground near City Park, Vasai" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          )}

          <div className="t-form-2">
            <div><span style={labelCss}>Date</span><DatePicker value={form.dateKey} onChange={(v) => set("dateKey", v)} min={today} future /></div>
            <div><span style={labelCss}>Time</span><Input placeholder="4 PM – 8 PM" value={form.time} onChange={(e) => set("time", e.target.value)} /></div>
          </div>
          <div className="t-form-2">
            <div><span style={labelCss}>Team slots</span><Input type="number" value={form.slots} onChange={(e) => set("slots", e.target.value)} /></div>
            <div><span style={labelCss}>Substitutes / team</span><Dropdown value={form.subs} onChange={(v) => set("subs", v)} options={[0, 1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} sub${n === 1 ? "" : "s"}` }))} /></div>
          </div>
          <div><span style={labelCss}>Prize pool</span><Input placeholder="₹10,000" value={form.prizePool} onChange={(e) => set("prizePool", e.target.value)} /></div>
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
                <button onClick={() => setConfirmDel(t)} aria-label="Delete" style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid var(--border-subtle)", background: "var(--color-canvas)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={16} color="var(--color-negative)" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {confirmDel && (
        <ModalShell onClose={() => setConfirmDel(null)} maxWidth={420}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-negative-pale)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="x" size={28} color="var(--color-negative)" stroke={2.6} />
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, textAlign: "center", margin: "0 0 8px" }}>Delete this battle?</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--color-body)", textAlign: "center", margin: "0 0 20px" }}>
            <strong>{confirmDel.title}</strong> and its {confirmDel.entrants} team registration{confirmDel.entrants === 1 ? "" : "s"} will be permanently removed. This can&apos;t be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="tertiary" fullWidth onClick={() => setConfirmDel(null)}>Keep it</Button>
            <Button fullWidth onClick={remove} style={{ background: "var(--color-negative)", color: "#fff" }}>Delete</Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
