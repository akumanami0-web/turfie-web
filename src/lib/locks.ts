import "server-only";
import type Redis from "ioredis";
import { prisma } from "./prisma";
import { LOCK_MINUTES } from "./content";

/* ── Slot-lock engine ───────────────────────────────────────────
   A slot is held exclusively for an owner for LOCK_MINUTES. Mirrors how
   BookMyShow/KheloMore hold inventory during checkout.

   Two interchangeable stores behind one interface:
   • Redis (when REDIS_URL is set) — the production path. Per-hour keys
     `turfie:lock:{turf}:{field}:{date}:{hour}` set with `SET NX PX 600000`.
   • Database (default) — a SlotLock row with expiresAt + unique constraint,
     so the app runs with zero external services.
   ─────────────────────────────────────────────────────────────── */

export type Held = { hour: number; until: number; mine: boolean };

export class SlotConflictError extends Error {
  constructor() {
    super("One or more slots are being booked by another player.");
    this.name = "SlotConflictError";
  }
}

interface LockStore {
  heldHours(turfId: string, field: string, dateKey: string, owner?: string): Promise<Held[]>;
  myExpiry(turfId: string, field: string, dateKey: string, hours: number[], owner: string): Promise<number>;
  claim(turfId: string, field: string, dateKey: string, hours: number[], owner: string, minutes: number): Promise<number>;
  release(turfId: string, field: string, dateKey: string, hours: number[], owner: string): Promise<void>;
}

/* ── Database store ── */
const dbStore: LockStore = {
  async heldHours(turfId, field, dateKey, owner) {
    await prisma.slotLock.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    const rows = await prisma.slotLock.findMany({ where: { turfId, field, dateKey, expiresAt: { gt: new Date() } } });
    return rows.map((r) => ({ hour: r.hour, until: r.expiresAt.getTime(), mine: !!owner && r.owner === owner }));
  },
  async myExpiry(turfId, field, dateKey, hours, owner) {
    const rows = await prisma.slotLock.findMany({ where: { turfId, field, dateKey, owner, hour: { in: hours }, expiresAt: { gt: new Date() } } });
    if (!rows.length) return 0;
    return Math.min(...rows.map((r) => r.expiresAt.getTime()));
  },
  async claim(turfId, field, dateKey, hours, owner, minutes) {
    await prisma.slotLock.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    const until = new Date(Date.now() + minutes * 60000);
    const conflict = await prisma.slotLock.findFirst({ where: { turfId, field, dateKey, hour: { in: hours }, owner: { not: owner }, expiresAt: { gt: new Date() } } });
    if (conflict) throw new SlotConflictError();
    await prisma.$transaction([
      prisma.slotLock.deleteMany({ where: { turfId, field, dateKey, owner } }),
      prisma.slotLock.deleteMany({ where: { turfId, field, dateKey, hour: { in: hours }, expiresAt: { lte: new Date() } } }),
      ...hours.map((hour) => prisma.slotLock.create({ data: { turfId, field, dateKey, hour, owner, expiresAt: until } })),
    ]);
    return until.getTime();
  },
  async release(turfId, field, dateKey, hours, owner) {
    await prisma.slotLock.deleteMany({ where: { turfId, field, dateKey, owner, hour: { in: hours } } });
  },
};

/* ── Redis store ── */
const g = globalThis as unknown as { __turfieRedis?: Redis };
async function redisClient(): Promise<Redis> {
  if (!g.__turfieRedis) {
    const { default: IORedis } = await import("ioredis");
    g.__turfieRedis = new IORedis(process.env.REDIS_URL as string, { maxRetriesPerRequest: 3 });
  }
  return g.__turfieRedis;
}
const lockKey = (t: string, f: string, d: string, h: number) => `turfie:lock:${t}:${f}:${d}:${h}`;
const ownKey = (owner: string, t: string, f: string, d: string) => `turfie:own:${owner}:${t}:${f}:${d}`;

async function scanKeys(r: Redis, pattern: string): Promise<string[]> {
  let cursor = "0";
  const keys: string[] = [];
  do {
    const [next, batch] = await r.scan(cursor, "MATCH", pattern, "COUNT", 200);
    cursor = next;
    keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

const redisStore: LockStore = {
  async heldHours(turfId, field, dateKey, owner) {
    const r = await redisClient();
    const keys = await scanKeys(r, lockKey(turfId, field, dateKey, 0).replace(/:0$/, ":*"));
    if (!keys.length) return [];
    const pipe = r.pipeline();
    keys.forEach((k) => { pipe.get(k); pipe.pttl(k); });
    const res = (await pipe.exec()) || [];
    const out: Held[] = [];
    keys.forEach((k, i) => {
      const val = res[i * 2]?.[1] as string | null;
      const pttl = res[i * 2 + 1]?.[1] as number;
      if (val && pttl > 0) {
        const hour = Number(k.split(":").pop());
        out.push({ hour, until: Date.now() + pttl, mine: !!owner && val === owner });
      }
    });
    return out;
  },
  async myExpiry(turfId, field, dateKey, hours, owner) {
    const r = await redisClient();
    const pipe = r.pipeline();
    hours.forEach((h) => { const k = lockKey(turfId, field, dateKey, h); pipe.get(k); pipe.pttl(k); });
    const res = (await pipe.exec()) || [];
    let min = Infinity;
    hours.forEach((_, i) => {
      const val = res[i * 2]?.[1] as string | null;
      const pttl = res[i * 2 + 1]?.[1] as number;
      if (val === owner && pttl > 0) min = Math.min(min, Date.now() + pttl);
    });
    return min === Infinity ? 0 : min;
  },
  async claim(turfId, field, dateKey, hours, owner, minutes) {
    const r = await redisClient();
    const ms = minutes * 60000;
    // conflict check
    const checkPipe = r.pipeline();
    hours.forEach((h) => checkPipe.get(lockKey(turfId, field, dateKey, h)));
    const checks = (await checkPipe.exec()) || [];
    if (checks.some(([, v]) => v && v !== owner)) throw new SlotConflictError();

    // release this owner's prior holds for this turf/field/date
    const oKey = ownKey(owner, turfId, field, dateKey);
    const prior = await r.smembers(oKey);
    if (prior.length) {
      const delPipe = r.pipeline();
      prior.forEach((h) => delPipe.del(lockKey(turfId, field, dateKey, Number(h))));
      delPipe.del(oKey);
      await delPipe.exec();
    }

    // claim new hours atomically (NX); roll back on any race
    const setPipe = r.pipeline();
    hours.forEach((h) => setPipe.set(lockKey(turfId, field, dateKey, h), owner, "PX", ms, "NX"));
    const setRes = (await setPipe.exec()) || [];
    if (setRes.some(([, v]) => v === null)) {
      const rb = r.pipeline();
      hours.forEach((h, i) => { if (setRes[i]?.[1] === "OK") rb.del(lockKey(turfId, field, dateKey, h)); });
      await rb.exec();
      throw new SlotConflictError();
    }

    await r.sadd(oKey, ...hours.map(String));
    await r.pexpire(oKey, ms);
    return Date.now() + ms;
  },
  async release(turfId, field, dateKey, hours, owner) {
    const r = await redisClient();
    const pipe = r.pipeline();
    for (const h of hours) {
      const k = lockKey(turfId, field, dateKey, h);
      const v = await r.get(k);
      if (v === owner) pipe.del(k);
    }
    pipe.srem(ownKey(owner, turfId, field, dateKey), ...hours.map(String));
    await pipe.exec();
  },
};

const store = (): LockStore => (process.env.REDIS_URL ? redisStore : dbStore);

export const heldHours = (turfId: string, field: string, dateKey: string, owner?: string) => store().heldHours(turfId, field, dateKey, owner);
export const myExpiry = (turfId: string, field: string, dateKey: string, hours: number[], owner: string) => store().myExpiry(turfId, field, dateKey, hours, owner);
export const claim = (turfId: string, field: string, dateKey: string, hours: number[], owner: string, minutes = LOCK_MINUTES) => store().claim(turfId, field, dateKey, hours, owner, minutes);
export const release = (turfId: string, field: string, dateKey: string, hours: number[], owner: string) => store().release(turfId, field, dateKey, hours, owner);
/** Payment success → the hold is consumed (booking row is the source of truth). */
export const confirm = (turfId: string, field: string, dateKey: string, hours: number[], owner: string) => store().release(turfId, field, dateKey, hours, owner);
