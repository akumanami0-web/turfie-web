import "server-only";
import { prisma } from "./prisma";
import { RESCHEDULE_FREE, RESCHEDULE_FEE } from "./content";
import { monthKey } from "./format";

/** 5 free reschedules per calendar month per owner, then ₹50 each. */
export async function rescheduleStatus(owner: string) {
  const month = monthKey();
  const row = await prisma.rescheduleUsage.findUnique({ where: { owner_month: { owner, month } } });
  const used = row?.count ?? 0;
  const freeLeft = Math.max(0, RESCHEDULE_FREE - used);
  return { used, freeLeft, fee: freeLeft > 0 ? 0 : RESCHEDULE_FEE };
}

export async function recordReschedule(owner: string) {
  const month = monthKey();
  await prisma.rescheduleUsage.upsert({
    where: { owner_month: { owner, month } },
    update: { count: { increment: 1 } },
    create: { owner, month, count: 1 },
  });
}

/** Free reschedules left this month for a user id. */
export async function freeReschedulesLeft(userId: string): Promise<number> {
  return (await rescheduleStatus("u:" + userId)).freeLeft;
}

/** Admin: nudge a user's remaining free reschedules by ±1 (clamped 0..FREE).
    Returns the new freeLeft. */
export async function adjustFreeReschedules(userId: string, delta: number): Promise<number> {
  const owner = "u:" + userId;
  const month = monthKey();
  const row = await prisma.rescheduleUsage.findUnique({ where: { owner_month: { owner, month } } });
  const used = row?.count ?? 0;
  const freeLeft = Math.max(0, RESCHEDULE_FREE - used);
  const nextFree = Math.min(RESCHEDULE_FREE, Math.max(0, freeLeft + delta));
  const nextUsed = RESCHEDULE_FREE - nextFree;
  await prisma.rescheduleUsage.upsert({
    where: { owner_month: { owner, month } },
    update: { count: nextUsed },
    create: { owner, month, count: nextUsed },
  });
  return nextFree;
}
