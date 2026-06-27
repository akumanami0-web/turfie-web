import { NextResponse } from "next/server";
import { createOrder } from "@/lib/payments";
import { ensureHold, SlotConflictError } from "@/lib/locks";
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

  // ensure this owner holds the slot (re-claim if the hold lapsed but the slot
  // is still free, so a lost hold never blocks a legitimate checkout)
  const owner = await getLockOwner();
  try {
    await ensureHold(turfId, field, dateKey, hours, owner);
  } catch (e) {
    if (e instanceof SlotConflictError) {
      return NextResponse.json({ error: "That slot was just taken by another player." }, { status: 409 });
    }
    throw e;
  }

  const order = await createOrder(total, `rcpt_${turfId}_${dateKey}_${hours[0]}`);
  return NextResponse.json(order);
}
