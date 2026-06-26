"use client";
import { useState, useEffect, useCallback } from "react";

const KEY = "turfie.fav";
const DEFAULT = ["box-park", "smash-pickle"];

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return Array.isArray(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Favourited turf ids, persisted to localStorage and synced across tabs. */
export function useFavourites() {
  const [fav, setFav] = useState<string[]>(DEFAULT);

  useEffect(() => {
    setFav(read());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setFav(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = (next: string[]) => {
    setFav(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const toggle = useCallback((id: string) => {
    setFav((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => fav.includes(id), [fav]);

  return { fav, toggle, isFav, setFav: persist };
}
