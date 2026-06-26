import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getLockOwner } from "@/lib/owner";
import { getTurf } from "@/lib/turfs";
import { rowToBooking, getUserBookings } from "@/lib/bookings";
import { verifyPayment } from "@/lib/payments";
import { confirm, myExpiry } from "@/lib/locks";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ bookings: await getUserBookings(user.id) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    turfId, field = "A", dateKey, dateLabel, startHour, hours = [], duration, durationHrs = 1,
    slotLabel, total, players, split = false, contact = {},
    payment = {},
  } = body;

  if (!turfId || !dateKey || !Array.isArray(hours) || !hours.length) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }
  const turf = await getTurf(turfId);
  if (!turf) return NextResponse.json({ error: "Turf not found" }, { status: 404 });

  const emailOk = /\S+@\S+\.\S+/.test(String(contact.email || "").trim());
  const phoneOk = String(contact.phone || "").replace(/\D/g, "").length >= 10;
  if (!emailOk && !phoneOk) {
    return NextResponse.json({ error: "A phone number or email is required." }, { status: 400 });
  }

  // payment must verify (simulated orders always pass)
  if (!verifyPayment(String(payment.orderId || ""), String(payment.paymentId || ""), String(payment.signature || ""))) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 402 });
  }

  // the hold must still be ours
  const owner = await getLockOwner();
  const until = await myExpiry(turfId, field, dateKey, hours, owner);
  if (!until || until <= Date.now()) {
    return NextResponse.json({ error: "Your slot hold has expired." }, { status: 410 });
  }

  const user = await getSessionUser();
  const kickoffAt = new Date(`${dateKey}T00:00:00`);
  kickoffAt.setHours(kickoffAt.getHours() + Number(startHour || hours[0] || 0));

  const id = "TRF-" + Math.floor(1000 + Math.random() * 9000);
  const created = await prisma.booking.create({
    data: {
      id,
      userId: user?.id ?? null,
      turfId,
      field,
      unit: turf.unit,
      dateKey,
      dateLabel: String(dateLabel || ""),
      time: String(slotLabel || ""),
      startHour: Number(startHour ?? hours[0]),
      duration: String(duration || `${durationHrs} hr`),
      durationHrs: Number(durationHrs) || 1,
      players: `1/${Number(players) || 10}`,
      status: "upcoming",
      price: Number(total) || turf.price,
      sport: turf.primary,
      split: !!split,
      kickoffAt,
      contactName: contact.name || null,
      contactPhone: contact.phone || null,
      contactEmail: contact.email || null,
    },
  });

  // consume the hold
  await confirm(turfId, field, dateKey, hours.map(Number), owner);

  return NextResponse.json({ booking: rowToBooking(created) });
}
