import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getTurf } from "@/lib/turfs";
import { rowToBooking } from "@/lib/bookings";
import { signTicket } from "@/lib/ticket";
import { TicketScreen } from "@/components/screens/TicketScreen";
export const metadata = { title: "Entry pass — Turfie" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const b = await prisma.booking.findUnique({ where: { id } });
  if (!b || b.userId !== user.id) redirect("/account/bookings");
  const turf = await getTurf(b.turfId);
  return <TicketScreen booking={rowToBooking(b)} turfName={turf?.name || "Turf"} area={turf?.area || ""} token={signTicket(b.id)} />;
}
