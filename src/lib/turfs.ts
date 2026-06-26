import "server-only";
import { prisma } from "./prisma";
import type { Turf, Review, SportId } from "./types";

type TurfRow = Awaited<ReturnType<typeof prisma.turf.findFirst>>;

export function rowToTurf(r: NonNullable<TurfRow>): Turf {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    sports: r.sports.split(",").filter(Boolean) as SportId[],
    primary: r.primary as SportId,
    area: r.area,
    pin: r.pin,
    distLabel: r.distLabel,
    lat: r.lat,
    lng: r.lng,
    rating: r.rating,
    reviews: r.reviews,
    price: r.price,
    surface: r.surface,
    formats: r.formats.split(",").filter(Boolean),
    open24: r.open24,
    openLabel: r.openLabel,
    openH: r.openH,
    closeH: r.closeH,
    fieldCount: r.fieldCount,
    unit: r.unit,
    blurb: r.blurb,
    amenities: r.amenities.split(",").filter(Boolean),
    spotsLeft: r.spotsLeft,
    popular: r.popular,
  };
}

export async function getTurfs(): Promise<Turf[]> {
  const rows = await prisma.turf.findMany({ orderBy: { rating: "desc" } });
  return rows.map(rowToTurf);
}

export async function getTurf(id: string): Promise<Turf | null> {
  const r = await prisma.turf.findUnique({ where: { id } });
  return r ? rowToTurf(r) : null;
}

export async function getReviews(turfId: string): Promise<Review[]> {
  const rows = await prisma.review.findMany({ where: { turfId } });
  return rows.map((r) => ({ who: r.who, initials: r.initials, rating: r.rating, whenLbl: r.whenLbl, text: r.text }));
}
