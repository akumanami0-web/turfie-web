import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TURFS, REVIEWS, DEMO_USER } from "../src/lib/seed-data";

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

  // ── Demo user ──
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { passwordHash },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      fullName: DEMO_USER.fullName,
      phone: DEMO_USER.phone,
      initials: DEMO_USER.initials,
      city: DEMO_USER.city,
      level: DEMO_USER.level,
      passwordHash,
    },
  });

  // ── Demo bookings (so My Bookings / Refunds have content) ──
  const now = Date.now();
  const bookings = [
    { id: "TRF-9842", turfId: "camp-nou", dateLabel: "Sat, 27 Jun 2026", time: "8:00 PM", duration: "1 hr", durationHrs: 1, players: "7/10", status: "upcoming", price: 1100, sport: "football", unit: "Pitch", field: "A", kickoffAt: new Date(now + 2 * 86400000) },
    { id: "TRF-9790", turfId: "box-park", dateLabel: "Sun, 28 Jun 2026", time: "7:00 AM", duration: "1 hr", durationHrs: 1, players: "5/9", status: "upcoming", price: 1300, sport: "football", unit: "Pitch", field: "A", kickoffAt: new Date(now + 8 * 3600000) },
    { id: "TRF-9612", turfId: "smash-pickle", dateLabel: "Fri, 13 Jun 2026", time: "6:00 PM", duration: "1 hr", durationHrs: 1, players: "4/4", status: "completed", price: 600, sport: "pickleball", unit: "Court", field: "A", kickoffAt: new Date(now - 12 * 86400000) },
    { id: "TRF-9540", turfId: "shuttle-hub", dateLabel: "Wed, 11 Jun 2026", time: "9:00 PM", duration: "1 hr", durationHrs: 1, players: "4/4", status: "completed", price: 450, sport: "badminton", unit: "Court", field: "B", kickoffAt: new Date(now - 14 * 86400000) },
    { id: "TRF-9401", turfId: "dream-arena", dateLabel: "Sat, 31 May 2026", time: "9:00 AM", duration: "1 hr", durationHrs: 1, players: "10/10", status: "cancelled", price: 1000, sport: "football", unit: "Pitch", field: "A", kickoffAt: new Date(now - 24 * 86400000), refundMethod: "Turfie wallet", cancelledAt: new Date(now - 3 * 86400000), refundPct: 100, refundAmount: 1000 },
  ];
  for (const b of bookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: { ...b, userId: user.id },
    });
  }

  console.log(`Seeded ${TURFS.length} turfs, demo user ${user.email}, ${bookings.length} bookings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
