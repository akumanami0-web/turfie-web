import { NextResponse } from "next/server";
import { getTurf } from "@/lib/turfs";
import { getAvailability } from "@/lib/availability";
import { getLockOwner } from "@/lib/owner";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const turfId = searchParams.get("turfId") || "";
  const field = searchParams.get("field") || "A";
  const date = searchParams.get("date") || "";
  if (!turfId || !date) return NextResponse.json({ error: "turfId and date are required" }, { status: 400 });

  const turf = await getTurf(turfId);
  if (!turf) return NextResponse.json({ error: "Turf not found" }, { status: 404 });

  const owner = await getLockOwner();
  const availability = await getAvailability(turf, field, date, owner);
  return NextResponse.json(availability);
}
