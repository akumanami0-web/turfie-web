import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { uploadAvatar, deleteAvatar, storageConfigured } from "@/lib/storage";

const MAX_BYTES = 8 * 1024 * 1024; // cropped images are tiny; this is a safety cap

/** Upload (and overwrite) the signed-in user's avatar. The image arrives
    already cropped to a small JPEG from the client. */
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: "Photo storage isn't configured yet." }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image received." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is too large." }, { status: 400 });

  let url: string;
  try {
    url = await uploadAvatar(session.id, await file.arrayBuffer(), "image/jpeg", "jpg");
  } catch {
    return NextResponse.json({ error: "Couldn't upload that image. Please try again." }, { status: 502 });
  }

  await prisma.user.update({ where: { id: session.id }, data: { photoUrl: url } });
  return NextResponse.json({ user: await getSessionUser() });
}

/** Remove the user's avatar. */
export async function DELETE() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteAvatar(session.id, "jpg");
  await prisma.user.update({ where: { id: session.id }, data: { photoUrl: null } });
  return NextResponse.json({ user: await getSessionUser() });
}
