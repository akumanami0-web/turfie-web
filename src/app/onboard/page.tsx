import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotRange, localDateKey } from "@/lib/format";
import { VendorScreen } from "@/components/screens/VendorScreen";

export const metadata = { title: "Turfie Onboard — Vendor" };

export default async function Page() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.vendor) redirect("/account");

  const myTurfs = await prisma.turf.findMany({ where: { ownerId: me.id }, select: { id: true, name: true, area: true, unit: true } });
  const turfIds = myTurfs.map((t) => t.id);
  const turfName = new Map(myTurfs.map((t) => [t.id, t.name]));

  const rows = turfIds.length
    ? await prisma.booking.findMany({ where: { turfId: { in: turfIds } }, orderBy: { createdAt: "desc" }, take: 100, include: { user: true } })
    : [];

  const todayKey = localDateKey(new Date());
  const bookings = rows.map((b) => ({
    id: b.id,
    who: b.user?.fullName || b.contactName || "Guest",
    turf: turfName.get(b.turfId) || b.turfId,
    unit: b.unit, field: b.field,
    dateLabel: b.dateLabel,
    time: slotRange(b.startHour, b.durationHrs) || b.time,
    price: b.price,
    status: b.status,
    checkedIn: !!b.checkedInAt,
    isToday: b.dateKey === todayKey,
    players: b.players,
    rescheduledAt: b.rescheduledAt ? b.rescheduledAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null,
    prevDateLabel: b.prevDateLabel,
    prevTime: b.prevTime,
  }));

  const active = bookings.filter((b) => b.status !== "cancelled");
  const kpis = {
    today: active.filter((b) => b.isToday).length,
    upcoming: bookings.filter((b) => b.status === "upcoming").length,
    revenue: active.reduce((s, b) => s + b.price, 0),
    checkedIn: bookings.filter((b) => b.checkedIn).length,
  };

  return <VendorScreen meName={me.name} turfs={myTurfs} bookings={bookings} kpis={kpis} />;
}
