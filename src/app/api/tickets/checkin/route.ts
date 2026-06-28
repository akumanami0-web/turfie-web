import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { verifyTicket } from "@/lib/ticket";

/** Mark a booking as checked-in. Vendor/operator only. Idempotent — a second
    scan reports it was already used (so a ticket can't be reused for two entries). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "operator") return NextResponse.json({ error: "Only venue staff can check tickets in." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = verifyTicket(String(body.token || ""));
  if (!id) return NextResponse.json({ error: "Invalid ticket." }, { status: 400 });

  const b = await prisma.booking.findUnique({ where: { id } });
  if (!b) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  if (b.status === "cancelled") return NextResponse.json({ error: "This booking was cancelled.", status: "cancelled" }, { status: 409 });

  if (b.checkedInAt) {
    return NextResponse.json({ ok: true, already: true, checkedInAt: b.checkedInAt.getTime() });
  }

  const updated = await prisma.booking.update({ where: { id }, data: { checkedInAt: new Date() } });
  return NextResponse.json({ ok: true, already: false, checkedInAt: updated.checkedInAt!.getTime() });
}
