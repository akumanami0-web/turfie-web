import "server-only";

// Profile photos live in a public Supabase Storage bucket. Images are cropped
// client-side to a ~1024px JPEG (a couple hundred KB), so they upload through
// our serverless function comfortably under Vercel's body limit.
const BUCKET = "avatars";
const SIZE_LIMIT = 10 * 1024 * 1024;

function cfg() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return url && key ? { url, key } : null;
}

export function storageConfigured() {
  return !!cfg();
}

/** Create the public avatars bucket if needed (idempotent). */
async function ensureBucket(url: string, key: string) {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: SIZE_LIMIT }),
  });
  if (!res.ok && res.status !== 400 && res.status !== 409) {
    throw new Error("bucket ensure failed: " + (await res.text()));
  }
}

/** Upload an avatar (overwriting the user's previous one) and return its
    public, cache-busted URL. */
export async function uploadAvatar(userId: string, bytes: ArrayBuffer, contentType: string, ext: string): Promise<string> {
  const c = cfg();
  if (!c) throw new Error("storage_not_configured");
  await ensureBucket(c.url, c.key);

  const path = `${userId}.${ext}`;
  const res = await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.key}`, apikey: c.key, "Content-Type": contentType, "x-upsert": "true", "cache-control": "3600" },
    body: Buffer.from(bytes),
  });
  if (!res.ok) throw new Error("upload failed: " + (await res.text()));

  return `${c.url}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now()}`;
}

/** Remove a user's stored avatar object (best-effort). */
export async function deleteAvatar(userId: string, ext: string) {
  const c = cfg();
  if (!c) return;
  await fetch(`${c.url}/storage/v1/object/${BUCKET}/${userId}.${ext}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${c.key}`, apikey: c.key },
  }).catch(() => {});
}
