import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getTurfs } from "@/lib/turfs";
import { SavedScreen } from "@/components/screens/SavedScreen";
export const metadata = { title: "Saved turfs — Turfie" };
export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const turfs = await getTurfs();
  return <SavedScreen turfs={turfs} />;
}
