import "server-only";
import { prisma } from "./prisma";

export type TournamentView = {
  id: string; title: string; sport: string; format: string; turfId: string | null; area: string | null;
  dateLabel: string; dateKey: string | null; time: string; slots: number; entryFee: number;
  prizePool: string | null; status: string; blurb: string | null; entrants: number; joined: boolean;
};

const RANK: Record<string, number> = { live: 0, upcoming: 1, completed: 2 };

function toView(r: { id: string; title: string; sport: string; format: string; turfId: string | null; area: string | null; dateLabel: string; dateKey: string | null; time: string; slots: number; entryFee: number; prizePool: string | null; status: string; blurb: string | null; _count: { entries: number } }, joined: boolean): TournamentView {
  return {
    id: r.id, title: r.title, sport: r.sport, format: r.format, turfId: r.turfId, area: r.area,
    dateLabel: r.dateLabel, dateKey: r.dateKey, time: r.time, slots: r.slots, entryFee: r.entryFee,
    prizePool: r.prizePool, status: r.status, blurb: r.blurb, entrants: r._count.entries, joined,
  };
}

export async function getTournaments(userId?: string): Promise<TournamentView[]> {
  const rows = await prisma.tournament.findMany({ include: { _count: { select: { entries: true } } } });
  let joined = new Set<string>();
  if (userId) {
    const e = await prisma.tournamentEntry.findMany({ where: { userId }, select: { tournamentId: true } });
    joined = new Set(e.map((x) => x.tournamentId));
  }
  return rows
    .map((r) => toView(r, joined.has(r.id)))
    .sort((a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9) || a.title.localeCompare(b.title));
}
