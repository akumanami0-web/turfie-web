import { NextResponse } from "next/server";
import { getForecast } from "@/lib/weather";
import { MAP_CENTER } from "@/lib/content";

/** Forecast for a lat/lng (defaults to the city centre). Used by the booking
    slot picker to flag rainy hours, and by the home weather banner. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat")) || MAP_CENTER.lat;
  const lng = Number(searchParams.get("lng")) || MAP_CENTER.lng;
  // Round so nearby turfs hit the same cache entry.
  const forecast = await getForecast(Math.round(lat * 20) / 20, Math.round(lng * 20) / 20);
  if (!forecast) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true, forecast });
}
