import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getTurf } from "@/lib/turfs";
import { signTicket } from "@/lib/ticket";
import { slotRange } from "@/lib/format";
import { googleWalletConfigured, appleWalletConfigured, googleSaveUrl } from "@/lib/wallet";

function appBaseUrl(req: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return `${req.headers.get("x-forwarded-proto") || "https"}://${host}`;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await prisma.booking.findUnique({ where: { id } });
  if (!b || b.userId !== user.id) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const platform = new URL(req.url).searchParams.get("platform") || "google";

  if (platform === "apple") {
    if (!appleWalletConfigured()) {
      return NextResponse.json({ error: "Apple Wallet isn't available yet — it needs a paid Apple Developer account." }, { status: 503 });
    }
    // (Apple .pkpass generation would go here once certificates are configured.)
    return NextResponse.json({ error: "Apple Wallet pass generation is not enabled." }, { status: 503 });
  }

  if (!googleWalletConfigured()) {
    return NextResponse.json({ error: "Google Wallet isn't set up yet. Add the Google Wallet issuer keys to enable it." }, { status: 503 });
  }

  const turf = await getTurf(b.turfId);
  try {
    const url = await googleSaveUrl({
      id: b.id,
      turfName: turf?.name || "Turf",
      area: turf?.area || "",
      dateLabel: b.dateLabel,
      time: slotRange(b.startHour, b.durationHrs) || b.time,
      unit: b.unit,
      field: b.field,
      token: signTicket(b.id),
      appUrl: appBaseUrl(req),
    });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Couldn't create the wallet pass." }, { status: 502 });
  }
}
