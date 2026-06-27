import "server-only";
import { prisma } from "./prisma";

/** Favourite turf ids for a user, read on the server so pages can hydrate
    the heart state immediately (no client fetch flash). */
export async function getFavourites(userId: string): Promise<string[]> {
  const rows = await prisma.favourite.findMany({ where: { userId }, select: { turfId: true } });
  return rows.map((r) => r.turfId);
}
