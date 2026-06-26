"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { Container, Display, Eyebrow } from "@/components/ui/layout-bits";
import { Icon } from "@/components/ui/Icon";
import { TurfCard } from "@/components/ui/TurfCard";
import { useFavourites } from "@/lib/useFavourites";
import type { Turf } from "@/lib/types";

export function SavedScreen({ turfs }: { turfs: Turf[] }) {
  const router = useRouter();
  const { fav } = useFavourites();
  const favs = fav.map((id) => turfs.find((t) => t.id === id)).filter(Boolean) as Turf[];
  return (
    <div style={{ background: "var(--color-canvas-soft)", minHeight: "100vh", paddingTop: 32, paddingBottom: 64 }}>
      <Container>
        <Eyebrow style={{ marginBottom: 8 }}>Your shortlist</Eyebrow>
        <Display size={38} style={{ marginBottom: 24 }}>Saved turfs</Display>
        {favs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <Icon name="heart" size={40} color="var(--color-mute)" style={{ margin: "0 auto 14px" }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--color-body)", marginBottom: 18 }}>No saved turfs yet. Tap the heart on any turf to save it.</p>
            <Button onClick={() => router.push("/browse")}>Browse turfs</Button>
          </div>
        ) : (
          <div className="t-card-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {favs.map((t) => <TurfCard key={t.id} turf={t} />)}
          </div>
        )}
      </Container>
    </div>
  );
}
