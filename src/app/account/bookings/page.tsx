import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/bookings";
import { getTurfs } from "@/lib/turfs";
import { BookingsScreen } from "@/components/screens/BookingsScreen";
export const metadata = { title: "My bookings — Turfie" };
export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [bookings, turfs] = await Promise.all([getUserBookings(user.id), getTurfs()]);
  return <BookingsScreen initialBookings={bookings} turfs={turfs} />;
}
