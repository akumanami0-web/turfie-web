import "server-only";
import { cookies } from "next/headers";
import { getSessionUser } from "./auth";

const LOCK_COOKIE = "turfie_lock_owner";

/** A stable identity for slot holds: the logged-in user id when present,
    otherwise an anonymous id persisted in an httpOnly cookie. */
export async function getLockOwner(): Promise<string> {
  const user = await getSessionUser();
  if (user) return "u:" + user.id;
  const jar = await cookies();
  let sid = jar.get(LOCK_COOKIE)?.value;
  if (!sid) {
    sid = "a:" + Math.random().toString(36).slice(2, 11);
    jar.set(LOCK_COOKIE, sid, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  }
  return sid;
}
