import "server-only";
import type Redis from "ioredis";

// Reuses the shared ioredis instance (same global the lock engine uses) when
// REDIS_URL is set; otherwise falls back to an in-memory window that is
// best-effort per warm serverless instance.
const g = globalThis as unknown as { __turfieRedis?: Redis; __turfieRL?: Map<string, number[]> };

/** Fixed-window rate limit. Returns true when the action is allowed. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  if (process.env.REDIS_URL) {
    try {
      if (!g.__turfieRedis) {
        const { default: IORedis } = await import("ioredis");
        g.__turfieRedis = new IORedis(process.env.REDIS_URL as string, { maxRetriesPerRequest: 3 });
      }
      const r = g.__turfieRedis;
      const k = `turfie:rl:${key}`;
      const n = await r.incr(k);
      if (n === 1) await r.expire(k, windowSec);
      return n <= limit;
    } catch {
      return true; // never block legitimate users if the limiter backend is down
    }
  }
  const now = Date.now();
  const store = (g.__turfieRL ||= new Map());
  const arr = (store.get(key) || []).filter((t: number) => now - t < windowSec * 1000);
  arr.push(now);
  store.set(key, arr);
  return arr.length <= limit;
}

/** Best-effort caller IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0].trim() : "") || req.headers.get("x-real-ip") || "unknown";
}
