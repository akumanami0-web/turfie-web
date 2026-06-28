import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { signUpload, avatarPath, storageConfigured } from "@/lib/storage";

const EXT = new Set(["jpg", "png", "webp"]);

/** Hand the client a short-lived signed URL to upload its avatar directly to
    Supabase Storage (so big/high-res images skip the serverless body limit). */
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: "Photo storage isn't configured yet." }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const ext = String(body.ext || "").toLowerCase();
  if (!EXT.has(ext)) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });

  const path = avatarPath(session.id, ext);
  try {
    const uploadUrl = await signUpload(path);
    return NextResponse.json({ uploadUrl, path });
  } catch {
    return NextResponse.json({ error: "Couldn't start the upload. Please try again." }, { status: 502 });
  }
}
