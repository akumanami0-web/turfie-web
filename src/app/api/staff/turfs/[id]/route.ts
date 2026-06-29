import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const STR = ["name", "kind", "area", "pin", "distLabel", "surface", "openLabel", "unit", "blurb", "sports", "formats", "amenities", "primary"];
const INT = ["price", "openH", "closeH", "fieldCount", "spotsLeft", "reviews"];
const FLOAT = ["lat", "lng", "rating"];
const BOOL = ["open24", "popular"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
  const t = await prisma.turf.findUnique({ where: { id } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ turf: t });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getSessionUser();
  if (!staff?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of STR) if (b[k] != null) data[k] = String(b[k]);
  for (const k of INT) if (b[k] != null && b[k] !== "") data[k] = Math.round(Number(b[k]));
  for (const k of FLOAT) if (b[k] != null && b[k] !== "") data[k] = Number(b[k]);
  for (const k of BOOL) if (typeof b[k] === "boolean") data[k] = b[k];

  // Sanity bounds so impossible values can't be saved.
  const clamp = (k: string, lo: number, hi: number) => { if (typeof data[k] === "number") data[k] = Math.min(hi, Math.max(lo, data[k] as number)); };
  clamp("openH", 0, 23);
  clamp("closeH", 1, 24);
  clamp("fieldCount", 1, 99);
  clamp("spotsLeft", 0, 999);
  clamp("price", 0, 1000000);
  clamp("reviews", 0, 1000000);
  clamp("rating", 0, 5);
  if (typeof data.openH === "number" && typeof data.closeH === "number" && (data.closeH as number) <= (data.openH as number)) {
    return NextResponse.json({ error: "Closing time must be after opening time." }, { status: 400 });
  }

  const turf = await prisma.turf.update({ where: { id }, data });
  return NextResponse.json({ turf });
}
