import { redirect } from "next/navigation";
import { getSessionUser, initialsFrom } from "@/lib/auth";
import { getTurfs } from "@/lib/turfs";
import { prisma } from "@/lib/prisma";
import { AdminScreen } from "@/components/screens/AdminScreen";

export const metadata = { title: "Partner dashboard — Turfie" };

const TONE: Record<string, "positive" | "neutral" | "negative"> = {
  upcoming: "neutral", completed: "neutral", cancelled: "negative", confirmed: "positive",
};

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const turfs = await getTurfs();
  const turfName = new Map(turfs.map((t) => [t.id, t.name]));

  // real recent bookings across the network feed the "Latest bookings" list
  const recent = await prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } });
  const live = recent.map((b) => {
    const who = b.user?.fullName || b.contactName || "Guest player";
    return {
      id: b.id,
      who,
      initials: b.user?.initials || initialsFrom(who),
      turf: turfName.get(b.turfId) || b.turfId,
      unit: b.unit, field: b.field, time: b.time || "—", dur: b.durationHrs,
      price: b.price, status: b.status, tone: TONE[b.status] || "neutral",
      when: "Recent", method: "UPI",
    };
  });

  return <AdminScreen turfs={turfs} live={live} />;
}
