import "server-only";
import crypto from "crypto";

// Entry tickets are signed so a QR code can't be forged: the token is the
// booking id plus an HMAC over it, keyed by AUTH_SECRET.
const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const sign = (id: string) => b64url(crypto.createHmac("sha256", secret).update(`ticket:${id}`).digest());

/** Opaque, tamper-proof ticket token for a booking id. */
export function signTicket(bookingId: string): string {
  return `${b64url(Buffer.from(bookingId))}.${sign(bookingId)}`;
}

/** Returns the booking id if the token is valid, else null. */
export function verifyTicket(token: string): string | null {
  const [idPart, sig] = String(token || "").split(".");
  if (!idPart || !sig) return null;
  let id: string;
  try {
    id = Buffer.from(idPart.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(id);
  // constant-time compare
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

/* ── Battle entry tickets (per tournament + user) ── */
const signBattle = (tid: string, uid: string) => b64url(crypto.createHmac("sha256", secret).update(`battle:${tid}:${uid}`).digest());

export function signBattleTicket(tournamentId: string, userId: string): string {
  return `B${b64url(Buffer.from(`${tournamentId}|${userId}`))}.${signBattle(tournamentId, userId)}`;
}

export function verifyBattleTicket(token: string): { tournamentId: string; userId: string } | null {
  const t = String(token || "");
  if (!t.startsWith("B")) return null;
  const [idPart, sig] = t.slice(1).split(".");
  if (!idPart || !sig) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(idPart.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return null;
  }
  const [tournamentId, userId] = decoded.split("|");
  if (!tournamentId || !userId) return null;
  const expected = signBattle(tournamentId, userId);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return { tournamentId, userId };
}
