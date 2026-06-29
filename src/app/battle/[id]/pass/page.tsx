import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { signBattleTicket } from "@/lib/ticket";
import { BattlePassScreen } from "@/components/screens/BattlePassScreen";
export const metadata = { title: "Battle pass — Turfie" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [t, entry] = await Promise.all([
    prisma.tournament.findUnique({ where: { id } }),
    prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: id, userId: user.id } } }),
  ]);
  if (!t || !entry) redirect("/battles");

  return (
    <BattlePassScreen
      battle={{ id: t.id, title: t.title, sport: t.sport, format: t.format, subs: t.subs, area: t.area, address: t.address, dateLabel: t.dateLabel, time: t.time, status: t.status, prizePool: t.prizePool }}
      playerName={user.fullName}
      checkedInAt={entry.checkedInAt ? entry.checkedInAt.getTime() : null}
      token={signBattleTicket(t.id, user.id)}
    />
  );
}
