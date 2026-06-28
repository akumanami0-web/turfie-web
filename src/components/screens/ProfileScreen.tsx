"use client";
import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { useSession } from "@/components/providers/session";
import { useToast } from "@/components/providers/toast";
import { profileSteps, PROFILE_TOTAL, GENDER_OPTIONS } from "@/lib/profile";
import { SPORTS } from "@/lib/content";
import { initialsFrom } from "@/lib/strings";
import type { SessionUser } from "@/lib/types";

const labelCss: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--color-ink)", marginBottom: 6, display: "block" };
const sectionTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, margin: 0 };

function ReadOnlyField({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <span style={labelCss}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-canvas-soft)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "var(--color-body)", fontFamily: "var(--font-body)", fontSize: 16 }}>
        {value || "—"}
      </div>
      {note && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>
          <Icon name="shield" size={13} color="var(--color-mute)" /> {note}
        </span>
      )}
    </div>
  );
}

export function ProfileScreen({ user, welcome = false }: { user: SessionUser; welcome?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { setUser } = useSession();

  const [name, setName] = useState(user.fullName || user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [birthday, setBirthday] = useState(user.birthday || "");
  const [gender, setGender] = useState(user.gender || "");
  const [favSport, setFavSport] = useState(user.favSport || "");
  const [photo, setPhoto] = useState(user.photoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast("Use a JPG, PNG or WebP image", "warning"); return; }
    if (file.size > 5 * 1024 * 1024) { toast("Image must be under 5 MB", "warning"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/photo", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { toast(data.error || "Couldn't upload photo", "error"); return; }
    setPhoto(data.user?.photoUrl || "");
    setUser(data.user);
    toast("Photo updated");
  }

  const steps = useMemo(() => profileSteps({ fullName: name, birthday, gender, favSport }), [name, birthday, gender, favSport]);
  const pct = Math.round((steps.done / steps.total) * 100);
  const initials = initialsFrom(name || "TU");

  const sportOptions = [{ value: "", label: "Select" }, ...SPORTS.map((s) => ({ value: s.id, label: s.label }))];

  async function save() {
    if (!name.trim()) { toast("Please enter your name", "warning"); return; }
    setBusy(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, birthday: birthday || null, gender: gender || null, favSport: favSport || null }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast(data.error || "Couldn't save your profile", "error"); return; }
    setUser(data.user);
    toast("Profile saved");
    router.push("/account");
  }

  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 24, paddingBottom: 80 }}>
      <Container style={{ maxWidth: 720 }}>
        <button onClick={() => router.push("/account")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--color-body)", padding: "4px 0", marginBottom: 14 }}>
          <Icon name="arrowLeft" size={18} /> Account
        </button>

        {welcome && (
          <Card tone="green" style={{ padding: "16px 18px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center" }}>
            <Icon name="checkCircle" size={20} color="var(--color-ink-deep)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--color-ink-deep)" }}>You&apos;re in! Add your name and a few details so we can personalise your games.</span>
          </Card>
        )}

        {/* Basic information */}
        <Card tone="white" style={{ padding: 26, marginBottom: 22 }}>
          <h2 style={sectionTitle}>Basic information</h2>

          <div style={{ marginTop: 18, marginBottom: 6 }}>
            <div style={{ height: 8, borderRadius: 999, background: "var(--color-canvas-soft)", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-primary)", borderRadius: 999, transition: "width .35s ease" }} />
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "var(--color-ink-deep)", marginTop: 8 }}>{steps.done} / {PROFILE_TOTAL} steps done</div>
          </div>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "18px 0 22px" }} />

          {/* avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ position: "relative" }}>
              <Avatar initials={initials} size={96} src={photo || null} style={{ opacity: uploading ? 0.5 : 1 }} />
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickPhoto} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change profile photo"
                style={{ position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRadius: "50%", border: "2px solid var(--color-canvas)", background: "var(--color-primary)", display: "grid", placeItems: "center", cursor: uploading ? "default" : "pointer" }}>
                <Icon name="edit" size={15} color="var(--color-on-primary)" />
              </button>
            </div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--color-mute)" }}>{uploading ? "Uploading…" : photo ? "Change profile photo" : "Add a profile photo"}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <ReadOnlyField label="Phone number" value={user.phone || "Not linked"} note="The phone number associated with your account can't be changed." />
            <Input label="Email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div>
              <span style={labelCss}>Birthday</span>
              <Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} hint="We'll surprise you with something on your special day." />
            </div>
          </div>
        </Card>

        {/* Additional details */}
        <Card tone="white" style={{ padding: 26, marginBottom: 22 }}>
          <h2 style={sectionTitle}>Additional details <span style={{ fontWeight: 600, fontSize: 16, color: "var(--color-mute)" }}>(optional)</span></h2>
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "18px 0 22px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <span style={labelCss}>Gender</span>
              <Dropdown value={gender} onChange={setGender} placeholder="Select" options={GENDER_OPTIONS} />
            </div>
            <div>
              <span style={labelCss}>Favourite sport</span>
              <Dropdown value={favSport} onChange={setFavSport} placeholder="Select"
                icon={favSport ? <SportGlyph sport={favSport} size={16} stroke={2.2} /> : null}
                options={sportOptions} />
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 12 }} className="t-2btn">
          <Button variant="tertiary" fullWidth onClick={() => router.push("/account")}>Cancel</Button>
          <Button fullWidth disabled={busy} onClick={save} iconRight={<Icon name="check" size={18} />}>
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </div>

        <Eyebrow style={{ textAlign: "center", marginTop: 22, color: "var(--color-mute)" }}>Your details are private and only used to improve your Turfie experience.</Eyebrow>
      </Container>
    </div>
  );
}
