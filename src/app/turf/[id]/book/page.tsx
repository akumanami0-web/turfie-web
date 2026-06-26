import { notFound } from "next/navigation";
import { getTurf } from "@/lib/turfs";
import { BookingScreen } from "@/components/screens/BookingScreen";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const turf = await getTurf(id);
  if (!turf) notFound();
  return <BookingScreen turf={turf} />;
}
