import "server-only";
import { unstable_cache } from "next/cache";

// Free, key-less forecast from Open-Meteo (https://open-meteo.com).
// Cached for 30 min so we don't hammer the API on every page view.

export type WeatherNow = {
  tempC: number;
  code: number;
  label: string;
  rain: boolean;            // is it raining now / very likely?
  glyph: "sun" | "cloud" | "rain" | "storm" | "fog";
};

export type WeatherForecast = {
  now: WeatherNow;
  /** keyed by `${yyyy-mm-dd}T${HH}` → chance of rain 0–100 */
  rainByHour: Record<string, number>;
  fetchedAt: number;
};

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const STORM_CODES = new Set([95, 96, 99]);

export function describeCode(code: number): { label: string; glyph: WeatherNow["glyph"] } {
  if (code === 0) return { label: "Clear sky", glyph: "sun" };
  if (code <= 3) return { label: "Partly cloudy", glyph: "cloud" };
  if (code === 45 || code === 48) return { label: "Foggy", glyph: "fog" };
  if (STORM_CODES.has(code)) return { label: "Thunderstorms", glyph: "storm" };
  if (RAIN_CODES.has(code)) return { label: "Rainy", glyph: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", glyph: "fog" };
  return { label: "Cloudy", glyph: "cloud" };
}

async function fetchForecast(lat: number, lng: number): Promise<WeatherForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,precipitation` +
    `&hourly=precipitation_probability,weather_code` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error("weather fetch failed");
  const data = await res.json();

  const code = Number(data.current?.weather_code ?? 0);
  const { label, glyph } = describeCode(code);
  const rainByHour: Record<string, number> = {};
  const times: string[] = data.hourly?.time || [];
  const probs: number[] = data.hourly?.precipitation_probability || [];
  const codes: number[] = data.hourly?.weather_code || [];
  for (let i = 0; i < times.length; i++) {
    // time looks like "2026-06-30T14:00"
    const key = times[i].slice(0, 13); // yyyy-mm-ddTHH
    let p = Number(probs[i] ?? 0);
    // Bump certainty when the hourly code itself is wet.
    const c = Number(codes[i] ?? 0);
    if (RAIN_CODES.has(c) || STORM_CODES.has(c)) p = Math.max(p, 70);
    rainByHour[key] = p;
  }

  return {
    now: { tempC: Math.round(Number(data.current?.temperature_2m ?? 0)), code, label, rain: glyph === "rain" || glyph === "storm", glyph },
    rainByHour,
    fetchedAt: Date.now(),
  };
}

/** Cached wrapper. Coordinates are rounded so nearby turfs share a cache entry. */
export const getForecast = unstable_cache(
  async (lat: number, lng: number) => {
    try {
      return await fetchForecast(lat, lng);
    } catch {
      return null;
    }
  },
  ["weather-forecast"],
  { revalidate: 1800 },
);
