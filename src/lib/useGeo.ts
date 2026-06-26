"use client";
import { useState, useEffect, useCallback } from "react";

type GeoStatus = "prompt" | "loading" | "granted" | "denied" | "unsupported";
type Coords = { lat: number; lng: number } | null;

function load<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v == null ? fallback : (v as T);
  } catch {
    return fallback;
  }
}
function save(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

/** Browser geolocation with consent persisted to localStorage. */
export function useGeo(onMessage?: (msg: string) => void) {
  const [coords, setCoords] = useState<Coords>(null);
  const [status, setStatus] = useState<GeoStatus>("prompt");

  useEffect(() => {
    setCoords(load<Coords>("turfie.geo", null));
    setStatus(load<GeoStatus>("turfie.geoStatus", "prompt"));
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      save("turfie.geoStatus", "unsupported");
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        save("turfie.geo", c);
        save("turfie.geoStatus", "granted");
        setCoords(c);
        setStatus("granted");
        onMessage?.("Location on — showing turfs near you");
      },
      () => {
        save("turfie.geoStatus", "denied");
        setStatus("denied");
        onMessage?.("Location off — showing turfs across Maharashtra");
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 },
    );
  }, [onMessage]);

  useEffect(() => {
    if (status === "granted" && !coords) request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, status, request };
}
