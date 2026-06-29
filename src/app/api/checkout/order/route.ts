import { NextResponse } from "next/server";
import { createOrder } from "@/lib/payments";
import { ensureHold, SlotConflictError } from "@/lib/locks";
import { getLockOwner } from "@/lib/owner";
import { getTurf } from "@/lib/turfs";
import { getSessionUser } from "@/lib/auth";
import { twilioConfigured } from "@/lib/otp";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const turfId = String(body.turfId || "");
  const field = String(body.field || "A");
  const dateKey = String(body.dateKey || "");
  const hours = Array.isArray(body.hours) ? (body.hours as number[]).map(Number) : [];
  if (!turfId || !dateKey || !hours.length) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  // Require a verified phone before taking any payment (active once OTP is set up).
  const sessionUser = await getSessionUser();
  if (twilioConfigured() && !sessionUser?.phoneVerified) {
    return NextResponse.json({ error: "Verify your phone number to book.", needsPhone: true }, { status: 403 });
  }

  // Never trust a client-supplied amount — compute the charge from the turf's
  // real rate and the number of hours requested.
  const turf = await getTurf(turfId);
  if (!turf) return NextResponse.json({ error: "Turf not found" }, { status: 404 });
  const total = turf.price * hours.length;

  // Apply Turfie wallet (server-authoritative) → the gateway only charges the rest.
  const walletApplied = body.useWallet && sessionUser ? Math.min(sessionUser.walletBalance, total) : 0;
  const charge = total - walletApplied;

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

  if (charge <= 0) return NextResponse.json({ fullyCovered: true, walletApplied });

  const order = await createOrder(charge, `rcpt_${turfId}_${dateKey}_${hours[0]}`);
  return NextResponse.json({ ...order, walletApplied });
}
