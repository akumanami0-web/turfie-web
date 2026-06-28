import { Suspense } from "react";
import { ScanScreen } from "@/components/screens/ScanScreen";
export const metadata = { title: "Check-in — Turfie" };
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScanScreen />
    </Suspense>
  );
}
