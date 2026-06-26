import { NextResponse } from "next/server";
import { createOrder } from "@/lib/payments";
import { myExpiry } from "@/lib/locks";
import { getLockOwner } from "@/lib/owner";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const turfId = String(body.turfId || "");
  const field = String(body.field || "A");
  const dateKey = String(body.dateKey || "");
  const hours = Array.isArray(body.hours) ? (body.hours as number[]).map(Number) : [];
  const total = Number(body.total || 0);
  if (!turfId || !dateKey || !hours.length || total <= 0) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  // the hold must still belong to this owner
  const owner = await getLockOwner();
  const until = await myExpiry(turfId, field, dateKey, hours, owner);
  if (!until || until <= Date.now()) {
    return NextResponse.json({ error: "Your slot hold has expired." }, { status: 410 });
  }

  const order = await createOrder(total, `rcpt_${turfId}_${dateKey}_${hours[0]}`);
  return NextResponse.json(order);
}
