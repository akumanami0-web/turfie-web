import { getTurfs } from "@/lib/turfs";
import { ConfirmScreen } from "@/components/screens/ConfirmScreen";
export const metadata = { title: "Booking confirmed — Turfie" };
export default async function Page() {
  const turfs = await getTurfs();
  return <ConfirmScreen turfs={turfs} />;
}
