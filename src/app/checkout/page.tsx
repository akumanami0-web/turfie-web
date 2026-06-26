import { getTurfs } from "@/lib/turfs";
import { CheckoutScreen } from "@/components/screens/CheckoutScreen";
export const metadata = { title: "Checkout — Turfie" };
export default async function Page() {
  const turfs = await getTurfs();
  return <CheckoutScreen turfs={turfs} />;
}
