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
