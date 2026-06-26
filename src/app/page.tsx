import { getTurfs } from "@/lib/turfs";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default async function HomePage() {
  const turfs = await getTurfs();
  const popular = turfs.filter((t) => t.popular).slice(0, 4);
  return <HomeScreen popular={popular} />;
}
