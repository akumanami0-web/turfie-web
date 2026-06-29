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

  // sample tournaments (battles) so the page isn't empty — staff can edit/add more
  const TOURNAMENTS = [
    { id: "battle-sun-5v5", title: "Sunday 5v5 Showdown", sport: "football", format: "5v5", area: "Nalasopara East", dateLabel: "Sun, 13 Jul", time: "4 PM – 9 PM", slots: 16, prizePool: "₹15,000", status: "upcoming", blurb: "Knockout format, referees provided. Winner takes the pool." },
    { id: "battle-box-cricket", title: "Box Cricket Cup", sport: "cricket", format: "6-a-side", area: "Nalasopara West", dateLabel: "Sat, 19 Jul", time: "10 AM – 6 PM", slots: 12, prizePool: "₹10,000", status: "upcoming", blurb: "Tennis-ball box cricket. Bring your crew." },
    { id: "battle-friday-night", title: "Friday Night Football", sport: "football", format: "7v7", area: "Vasai", dateLabel: "Fri, 11 Jul", time: "8 PM – 12 AM", slots: 10, prizePool: "₹8,000", status: "live", blurb: "Floodlit 7v7 league night." },
  ];
  for (const t of TOURNAMENTS) {
    await prisma.tournament.upsert({ where: { id: t.id }, update: {}, create: t });
  }

  console.log(`Seeded ${TURFS.length} turfs, reviews and ${TOURNAMENTS.length} tournaments. No demo accounts — sign up to create real users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
