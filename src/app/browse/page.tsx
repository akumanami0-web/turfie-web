import { getTurfs } from "@/lib/turfs";
import { BrowseScreen } from "@/components/screens/BrowseScreen";

export const metadata = { title: "Browse turfs — Turfie" };

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ sport?: string }> }) {
  const { sport } = await searchParams;
  const turfs = await getTurfs();
  return <BrowseScreen turfs={turfs} initialSport={sport || "all"} />;
}
