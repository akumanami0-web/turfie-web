import { getSessionUser } from "@/lib/auth";
import { getTournaments } from "@/lib/tournaments";
import { BattlesScreen } from "@/components/screens/BattlesScreen";
export const metadata = { title: "Battles — Turfie" };

export default async function Page() {
  const user = await getSessionUser();
  const tournaments = await getTournaments(user?.id);
  return <BattlesScreen tournaments={tournaments} loggedIn={!!user} />;
}
