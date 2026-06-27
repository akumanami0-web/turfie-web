import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/bookings";
import { getFavourites } from "@/lib/favourites";
import { AccountScreen } from "@/components/screens/AccountScreen";
export const metadata = { title: "Account — Turfie" };
export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [bookings, initialFav] = await Promise.all([getUserBookings(user.id), getFavourites(user.id)]);
  return <AccountScreen bookings={bookings} initialFav={initialFav} />;
}
