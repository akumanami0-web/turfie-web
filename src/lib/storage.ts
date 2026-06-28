import "server-only";

// Profile photos live in a public Supabase Storage bucket. We talk to the
// Storage REST API directly with the service-role key (server-side only) so we
// don't need to add the Supabase SDK as a dependency.
const BUCKET = "avatars";

function cfg() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return url && key ? { url, key } : null;
}

export function storageConfigured() {
  return !!cfg();
}

/** Create the public avatars bucket if it doesn't exist yet (idempotent). */
async function ensureBucket(url: string, key: string) {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 5 * 1024 * 1024 }),
  });
  // 200 = created, 400/409 = already exists — both fine.
  if (!res.ok && res.status !== 400 && res.status !== 409) {
    throw new Error("bucket create failed: " + (await res.text()));
  }
}

/** Upload an avatar and return its public URL (cache-busted). */
export async function uploadAvatar(userId: string, bytes: ArrayBuffer, contentType: string, ext: string): Promise<string> {
  const c = cfg();
  if (!c) throw new Error("storage_not_configured");
  await ensureBucket(c.url, c.key);

  const path = `${userId}.${ext}`;
  const res = await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.key}`,
      apikey: c.key,
      "Content-Type": contentType,
      "x-upsert": "true", // overwrite the user's previous photo
      "cache-control": "3600",
    },
    body: Buffer.from(bytes),
  });
  if (!res.ok) throw new Error("upload failed: " + (await res.text()));

  return `${c.url}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now()}`;
}
