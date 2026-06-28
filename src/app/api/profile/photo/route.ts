import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { uploadAvatar, storageConfigured } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!storageConfigured()) {
    return NextResponse.json({ error: "Photo storage isn't configured yet." }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });

  const bytes = await file.arrayBuffer();
  let url: string;
  try {
    url = await uploadAvatar(session.id, bytes, file.type, ext);
  } catch {
    return NextResponse.json({ error: "Couldn't upload that image. Please try again." }, { status: 502 });
  }

  await prisma.user.update({ where: { id: session.id }, data: { photoUrl: url } });
  return NextResponse.json({ user: await getSessionUser() });
}
