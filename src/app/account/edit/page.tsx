import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
export const metadata = { title: "Edit profile — Turfie" };
export default async function Page({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { welcome } = await searchParams;
  return <ProfileScreen user={user} welcome={welcome === "1"} />;
}
