import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTurf } from "@/lib/turfs";
import { verifyTicket } from "@/lib/ticket";
import { slotRange } from "@/lib/format";

/** Validate a scanned ticket token and return the booking summary.
    The signed token is itself the proof, so no login is required to read it
    (the vendor scanning may not own the booking). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = verifyTicket(String(body.token || ""));
  if (!id) return NextResponse.json({ ok: false, error: "Invalid ticket." }, { status: 400 });

  const b = await prisma.booking.findUnique({ where: { id } });
  if (!b) return NextResponse.json({ ok: false, error: "Ticket not found." }, { status: 404 });
  const turf = await getTurf(b.turfId);

  return NextResponse.json({
    ok: true,
    booking: {
      id: b.id,
      turfName: turf?.name || "Turf",
      area: turf?.area || "",
      sport: b.sport,
      unit: b.unit,
      field: b.field,
      dateLabel: b.dateLabel,
      time: slotRange(b.startHour, b.durationHrs) || b.time,
      duration: b.duration,
      status: b.status,
      checkedInAt: b.checkedInAt ? b.checkedInAt.getTime() : null,
      name: b.contactName,
    },
  });
}
