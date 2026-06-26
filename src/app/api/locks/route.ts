import { NextResponse } from "next/server";
import { claim, release, SlotConflictError } from "@/lib/locks";
import { getLockOwner } from "@/lib/owner";

function parse(body: Record<string, unknown>) {
  return {
    turfId: String(body.turfId || ""),
    field: String(body.field || "A"),
    dateKey: String(body.dateKey || ""),
    hours: Array.isArray(body.hours) ? (body.hours as number[]).map(Number) : [],
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { turfId, field, dateKey, hours } = parse(body);
  if (!turfId || !dateKey || !hours.length) {
    return NextResponse.json({ error: "turfId, dateKey and hours are required" }, { status: 400 });
  }
  const owner = await getLockOwner();
  try {
    const until = await claim(turfId, field, dateKey, hours, owner);
    return NextResponse.json({ until });
  } catch (e) {
    if (e instanceof SlotConflictError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { turfId, field, dateKey, hours } = parse(body);
  const owner = await getLockOwner();
  await release(turfId, field, dateKey, hours, owner);
  return NextResponse.json({ ok: true });
}
