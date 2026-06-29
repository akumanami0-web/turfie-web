import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTournaments } from "@/lib/tournaments";
import { StaffScreen } from "@/components/screens/StaffScreen";

export const metadata = { title: "Turfie Admin — Team" };

export default async function Page() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.staff) redirect("/account");

  const [usersRaw, bookingsRaw, turfsRaw, tournaments, playerCount, bookingCount, revenueAgg] = await Promise.all([
    prisma.user.findMany({ orderBy: { joinedAt: "desc" }, take: 200, include: { _count: { select: { bookings: true } } } }),
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 60, include: { user: true } }),
    prisma.turf.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, area: true, ownerId: true } }),
    getTournaments(),
    prisma.user.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({ _sum: { price: true }, where: { status: { in: ["upcoming", "completed"] } } }),
  ]);

  const turfName = new Map(turfsRaw.map((t) => [t.id, t.name]));
  const fmtDate = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const users = usersRaw.map((u) => ({
    id: u.id, name: u.fullName, email: u.email, phone: u.phone, role: u.role,
    phoneVerified: u.phoneVerified, joined: fmtDate(u.joinedAt), bookings: u._count.bookings,
    initials: u.initials, photoUrl: u.photoUrl, suspended: u.suspended,
  }));
  const bookings = bookingsRaw.map((b) => ({
    id: b.id, who: b.user?.fullName || b.contactName || "Guest", turf: turfName.get(b.turfId) || b.turfId,
    dateLabel: b.dateLabel, time: b.time, price: b.price, status: b.status,
  }));

  const kpis = { players: playerCount, bookings: bookingCount, revenue: revenueAgg._sum.price || 0, tournaments: tournaments.length };

  return <StaffScreen meName={me.name} kpis={kpis} users={users} bookings={bookings} turfs={turfsRaw} tournaments={tournaments} />;
}
