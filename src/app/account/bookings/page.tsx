import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/bookings";
import { getTurfs } from "@/lib/turfs";
import { getLockOwner } from "@/lib/owner";
import { rescheduleStatus } from "@/lib/reschedule";
import { BookingsScreen } from "@/components/screens/BookingsScreen";
export const metadata = { title: "My bookings — Turfie" };
export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [bookings, turfs, owner] = await Promise.all([getUserBookings(user.id), getTurfs(), getLockOwner()]);
  const reschedule = await rescheduleStatus(owner);
  return <BookingsScreen initialBookings={bookings} turfs={turfs} reschedule={reschedule} />;
}
