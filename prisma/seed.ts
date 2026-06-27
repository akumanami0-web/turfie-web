import { PrismaClient } from "@prisma/client";
import { TURFS, REVIEWS } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  // ── Turfs + reviews ──
  for (const t of TURFS) {
    await prisma.turf.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        kind: t.kind,
        sports: t.sports.join(","),
        primary: t.primary,
        area: t.area,
        pin: t.pin,
        distLabel: t.distLabel,
        lat: t.lat,
        lng: t.lng,
        rating: t.rating,
        reviews: t.reviews,
        price: t.price,
        surface: t.surface,
        formats: t.formats.join(","),
        open24: t.open24,
        openLabel: t.openLabel,
        openH: t.openH,
        closeH: t.closeH,
        fieldCount: t.fieldCount,
        unit: t.unit,
        blurb: t.blurb,
        amenities: t.amenities.join(","),
        spotsLeft: t.spotsLeft,
        popular: t.popular,
      },
    });
  }

  // attach the standard review set to a few popular turfs for the detail page
  await prisma.review.deleteMany({});
  for (const turfId of ["camp-nou", "box-park", "dream-arena", "smash-pickle", "shuttle-hub", "ace-tennis", "sandor", "achievers"]) {
    for (const r of REVIEWS) {
      await prisma.review.create({
        data: { turfId, who: r.who, initials: r.initials, rating: r.rating, whenLbl: r.whenLbl, text: r.text },
      });
    }
  }

  console.log(`Seeded ${TURFS.length} turfs and their reviews. No demo accounts — sign up to create real users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
