import type { Turf } from "./types";

export function dirUrl(t: Pick<Turf, "lat" | "lng" | "area" | "name"> | null | undefined) {
  if (t && t.lat && t.lng) return `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((t && (t.area || t.name)) || "Nalasopara")}`;
}

export function mapsSearchUrl(t: Pick<Turf, "lat" | "lng" | "name" | "area"> | null | undefined) {
  const q = t && t.lat && t.lng ? `${t.lat},${t.lng}` : (t && t.name + " " + t.area) || "Nalasopara";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function haversineKm(a: { lat: number; lng: number } | null, b: { lat: number; lng: number } | null) {
  if (!a || !b) return null;
  const R = 6371, toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Embed URL — uses the keyed Maps Embed API when a key is set, else the keyless embed. */
export function mapEmbedSrc(query: string, zoom: number, key?: string) {
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}&zoom=${zoom}`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
}
