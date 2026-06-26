import { PrismaClient, Prisma } from "@prisma/client";
import { existsSync, copyFileSync } from "node:fs";
import path from "node:path";

/* Pick a datasource URL override only when we must:
   • Postgres (DATABASE_URL=postgres://…) or local dev → no override; Prisma
     reads env(DATABASE_URL), resolving SQLite relative to the schema dir.
   • Vercel without Postgres → zero-config SQLite demo: copy the build-time
     seeded prisma/build.db to a writable /tmp path and use that (absolute, so
     it resolves the same regardless of cwd). Add a Vercel Postgres + redeploy
     to switch to durable storage automatically. */
function datasourceOverride(): string | undefined {
  const url = process.env.DATABASE_URL || "";
  if (/^postgres(ql)?:\/\//.test(url)) return undefined; // Postgres: use env
  if (!process.env.VERCEL) return undefined; // local dev: use env (schema-relative)

  const target = "/tmp/turfie.db";
  const seed = path.join(process.cwd(), "prisma", "build.db");
  try {
    if (!existsSync(target) && existsSync(seed)) copyFileSync(seed, target);
  } catch {
    /* Prisma will surface a clear error if the DB is unreachable */
  }
  return `file:${target}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const override = datasourceOverride();
  const opts: Prisma.PrismaClientOptions = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };
  if (override) opts.datasources = { db: { url: override } };
  return new PrismaClient(opts);
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
