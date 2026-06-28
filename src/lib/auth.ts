import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { SessionUser } from "./types";

const COOKIE = "turfie_session";
const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me",
);

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

async function signToken(userId: string) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

/** Write the session cookie for a user id (call from a route handler / server action). */
export async function setSession(userId: string) {
  const token = await signToken(userId);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Read + verify the current session, returning a serializable user (or null).
    Wrapped in React cache() so the layout + page share one lookup per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const uid = payload.uid as string;
    const u = await prisma.user.findUnique({ where: { id: uid } });
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      initials: u.initials,
      city: u.city,
      level: u.level,
      role: u.role,
      birthday: u.birthday,
      gender: u.gender,
      favSport: u.favSport,
      photoUrl: u.photoUrl,
      phoneVerified: u.phoneVerified,
    };
  } catch {
    return null;
  }
});

export { initialsFrom } from "./strings";
