import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (!String(b.title || "").trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const t = await prisma.tournament.create({
    data: {
      title: String(b.title).trim(),
      sport: String(b.sport || "football"),
      format: String(b.format || "5v5"),
      area: b.area ? String(b.area) : null,
      turfId: b.turfId ? String(b.turfId) : null,
      address: b.address ? String(b.address) : null,
      dateLabel: String(b.dateLabel || "TBA"),
      dateKey: b.dateKey ? String(b.dateKey) : null,
      startAt: b.startAt ? new Date(b.startAt) : null,
      time: String(b.time || "TBA"),
      slots: Math.max(2, Number(b.slots) || 16),
      subs: Math.min(5, Math.max(0, Number(b.subs) || 0)),
      entryFee: Math.max(0, Number(b.entryFee) || 0),
      prizePool: b.prizePool ? String(b.prizePool) : null,
      blurb: b.blurb ? String(b.blurb) : null,
      status: ["upcoming", "live", "completed"].includes(b.status) ? b.status : "upcoming",
    },
  });
  return NextResponse.json({ tournament: t });
}
