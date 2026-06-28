"use client";
import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui/primitives";
import { Container, Display, Eyebrow, Avatar } from "@/components/ui/layout-bits";
import { Icon, SportGlyph } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { PhoneLinkModal, ChangeEmailModal } from "@/components/screens/VerifyModals";
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
  const [phone, setPhone] = useState(user.phone || "");
  const [phoneVerified, setPhoneVerified] = useState(user.phoneVerified);
  const [birthday, setBirthday] = useState(user.birthday || "");
  const [gender, setGender] = useState(user.gender || "");
  const [favSport, setFavSport] = useState(user.favSport || "");
  const [photo, setPhoto] = useState(user.photoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1: choose a file → open the cropper (always crop before upload).
  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast("Use a JPG, PNG or WebP image", "warning"); return; }
    if (file.size > 50 * 1024 * 1024) { toast("Image must be under 50 MB", "warning"); return; }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

  // Step 2: cropped → upload the small square JPEG through our API.
  async function uploadCropped(blob: Blob) {
    setCropSrc(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/profile/photo", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't upload photo");
      setPhoto(data.user?.photoUrl || "");
      setUser(data.user);
      toast("Photo updated");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't upload photo", "error");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    try {
      const res = await fetch("/api/profile/photo", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't remove photo");
      setPhoto("");
      setUser(data.user);
      toast("Photo removed");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't remove photo", "error");
    } finally {
      setUploading(false);
    }
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
      body: JSON.stringify({ name, birthday: birthday || null, gender: gender || null, favSport: favSport || null }),
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
      {cropSrc && <ImageCropper src={cropSrc} onCancel={() => setCropSrc(null)} onDone={uploadCropped} />}
      {showPhone && <PhoneLinkModal onClose={() => setShowPhone(false)} onVerified={(u) => { setShowPhone(false); setPhone(u.phone || ""); setPhoneVerified(true); setUser(u); }} />}
      {showEmail && <ChangeEmailModal currentEmail={email} onClose={() => setShowEmail(false)} onVerified={(u) => { setShowEmail(false); setEmail(u.email); setUser(u); }} />}
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
            {photo && !uploading && (
              <button onClick={removePhoto} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--color-negative)" }}>Remove photo</button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input label="Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />

            {/* Phone — linked once, then immutable */}
            {phoneVerified ? (
              <ReadOnlyField label="Phone number" value={phone} note="Verified — your phone number can't be changed." />
            ) : (
              <div>
                <span style={labelCss}>Phone number</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--color-canvas-soft)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "10px 12px 10px 16px" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-mute)" }}>Not linked</span>
                  <Button size="sm" onClick={() => setShowPhone(true)} iconLeft={<Icon name="phone" size={15} />}>Add &amp; verify</Button>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>
                  <Icon name="shield" size={13} color="var(--color-mute)" /> Verify a phone to secure your account and make bookings.
                </span>
              </div>
            )}

            {/* Email — change requires a verified phone + email OTP */}
            <div>
              <span style={labelCss}>Email</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--color-canvas-soft)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "10px 12px 10px 16px" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
                <Button size="sm" variant="tertiary" disabled={!phoneVerified} onClick={() => setShowEmail(true)}>Change</Button>
              </div>
              {!phoneVerified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--color-mute)" }}>
                  <Icon name="shield" size={13} color="var(--color-mute)" /> Link a verified phone number to change your email.
                </span>
              )}
            </div>

            <div>
              <span style={labelCss}>Birthday</span>
              <DatePicker value={birthday} onChange={setBirthday} max={new Date().toISOString().slice(0, 10)} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-mute)", marginTop: 6, display: "block" }}>We&apos;ll surprise you with something on your special day.</span>
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
