import "server-only";
import { prisma } from "./prisma";

/** Adjust a user's Turfie wallet balance (signed amount) and log a ledger entry.
    Returns the new balance. Never lets the balance go below zero. */
export async function adjustWallet(userId: string, amount: number, kind: string, note?: string): Promise<number> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
  if (!u) throw new Error("user not found");
  const next = Math.max(0, u.walletBalance + amount);
  const applied = next - u.walletBalance; // actual delta after the floor
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { walletBalance: next } }),
    prisma.walletTxn.create({ data: { userId, amount: applied, kind, note: note || null } }),
  ]);
  return next;
}
