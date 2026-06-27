"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/components/providers/session";

const KEY = "turfie.fav";

function readLS(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Favourited turf ids.
    • Logged in → stored per-account in the database (synced across devices).
    • Guest → stored per-browser in localStorage so the heart still works. */
export function useFavourites(initial?: string[]) {
  const { user } = useSession();
  const [fav, setFav] = useState<string[]>(initial ?? []);
  // When the server already handed us the list, skip the first fetch so the
  // correct content paints immediately (no empty -> loaded blink).
  const skip = useRef(initial != null);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    let cancelled = false;
    if (user) {
      fetch("/api/favourites", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => { if (!cancelled) setFav(Array.isArray(d.ids) ? d.ids : []); })
        .catch(() => {});
    } else {
      setFav(readLS());
    }
    return () => { cancelled = true; };
  }, [user]);

  const toggle = useCallback((id: string) => {
    setFav((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (user) {
        fetch("/api/favourites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turfId: id }) })
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d.ids)) setFav(d.ids); })
          .catch(() => {});
      } else {
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  }, [user]);

  const isFav = useCallback((id: string) => fav.includes(id), [fav]);

  return { fav, toggle, isFav, setFav };
}
