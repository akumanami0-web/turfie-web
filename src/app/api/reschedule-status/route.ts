import { NextResponse } from "next/server";
import { getLockOwner } from "@/lib/owner";
import { rescheduleStatus } from "@/lib/reschedule";

export async function GET() {
  const owner = await getLockOwner();
  return NextResponse.json(await rescheduleStatus(owner));
}
