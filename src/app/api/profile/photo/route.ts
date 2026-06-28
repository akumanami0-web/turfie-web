import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { publicUrlFor, storageConfigured } from "@/lib/storage";

/** Persist the user's avatar URL after the browser uploaded it via the signed
    URL. The path must live under this user's own folder, so it can't be spoofed. */
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: "Photo storage isn't configured yet." }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const path = String(body.path || "");
  if (!path.startsWith(`${session.id}/`)) {
    return NextResponse.json({ error: "Invalid upload path." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.id }, data: { photoUrl: publicUrlFor(path) } });
  return NextResponse.json({ user: await getSessionUser() });
}
