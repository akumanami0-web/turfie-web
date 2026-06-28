import "server-only";

// Profile photos live in a public Supabase Storage bucket. To support large
// (high-res / 4K) images we don't stream the file through our serverless
// function — Vercel caps request bodies at ~4.5 MB. Instead we hand the client
// a short-lived signed upload URL and it uploads straight to Supabase.
const BUCKET = "avatars";
const SIZE_LIMIT = 50 * 1024 * 1024; // 50 MB

function cfg() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return url && key ? { url, key } : null;
}

export function storageConfigured() {
  return !!cfg();
}

/** Create the public avatars bucket if needed, and keep its size limit high. */
async function ensureBucket(url: string, key: string) {
  const headers = { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" };
  const body = JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: SIZE_LIMIT });
  const res = await fetch(`${url}/storage/v1/bucket`, { method: "POST", headers, body });
  if (res.ok) return;
  if (res.status === 400 || res.status === 409) {
    // Already exists — make sure its size limit is raised for older buckets.
    await fetch(`${url}/storage/v1/bucket/${BUCKET}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ public: true, file_size_limit: SIZE_LIMIT }),
    }).catch(() => {});
    return;
  }
  throw new Error("bucket ensure failed: " + (await res.text()));
}

/** Public URL for a stored object path. */
export function publicUrlFor(path: string): string {
  const c = cfg();
  if (!c) return "";
  return `${c.url}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** A per-upload object path for this user (unique, so signing never collides
    with an existing object). */
export function avatarPath(userId: string, ext: string): string {
  return `${userId}/${Date.now()}.${ext}`;
}

/** Mint a signed URL the browser can PUT the image straight to. */
export async function signUpload(path: string): Promise<string> {
  const c = cfg();
  if (!c) throw new Error("storage_not_configured");
  await ensureBucket(c.url, c.key);

  const res = await fetch(`${c.url}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.key}`, apikey: c.key, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("sign failed: " + (await res.text()));
  const { url } = await res.json(); // e.g. "/object/upload/sign/avatars/<path>?token=..."
  return `${c.url}/storage/v1${url}`;
}
