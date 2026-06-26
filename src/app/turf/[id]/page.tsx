import { notFound } from "next/navigation";
import { getTurf, getReviews } from "@/lib/turfs";
import { CourtScreen } from "@/components/screens/CourtScreen";

export default async function CourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const turf = await getTurf(id);
  if (!turf) notFound();
  const reviews = await getReviews(id);
  return <CourtScreen turf={turf} reviews={reviews} />;
}
