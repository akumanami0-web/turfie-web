import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/bookings";
import { getTurfs } from "@/lib/turfs";
import { RefundsScreen } from "@/components/screens/RefundsScreen";
export const metadata = { title: "Refunds — Turfie" };
export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [bookings, turfs] = await Promise.all([getUserBookings(user.id), getTurfs()]);
  return <RefundsScreen bookings={bookings} turfs={turfs} />;
}
