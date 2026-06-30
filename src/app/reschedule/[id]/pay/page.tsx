import { prisma } from "@/lib/prisma";
import { getTurf } from "@/lib/turfs";
import { slotRange, fmtDateShort } from "@/lib/format";
import { RESCHEDULE_FEE } from "@/lib/content";
import { ReschedulePay } from "@/components/screens/ReschedulePay";

export const metadata = { title: "Turfie — Confirm reschedule" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await prisma.booking.findUnique({ where: { id } });
  const pending = b?.pendingReschedule ? (() => { try { return JSON.parse(b.pendingReschedule!); } catch { return null; } })() : null;
  const turf = b ? await getTurf(b.turfId) : null;

  const fromLabel = b ? `${b.dateLabel} · ${slotRange(b.startHour, b.durationHrs) || b.time}` : "";
  const toLabel = pending ? `${fmtDateShort(new Date(`${pending.dateKey}T00:00:00`))} · ${slotRange(pending.startHour, pending.durationHrs)}` : "";

  return (
    <ReschedulePay
      id={id}
      ok={!!b && !!pending}
      turfName={turf?.name || "Your booking"}
      fromLabel={fromLabel}
      toLabel={toLabel}
      fee={RESCHEDULE_FEE}
    />
  );
}
