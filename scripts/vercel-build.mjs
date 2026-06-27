// Vercel build entrypoint.
// • If a Postgres URL is present (via any common env name) → switch Prisma to
//   postgres, push the schema (using a direct/unpooled URL when available), build.
// • Otherwise → build a self-contained SQLite demo (seeded prisma/build.db that
//   runs from /tmp at runtime; see src/lib/prisma.ts). Zero services required.
import { execSync } from "node:child_process";

const run = (cmd, env = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
};

const isPg = (u) => !!u && /^postgres(ql)?:\/\//.test(u);
// Pooled/runtime URL — what the app queries through at runtime.
const runtimeUrl = [
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
].find(isPg);
// Direct/unpooled URL — required for schema push/migrate (no pgbouncer).
const directUrl = [
  process.env.DATABASE_URL_UNPOOLED,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.DIRECT_URL,
  runtimeUrl,
].find(isPg);

if (runtimeUrl) {
  console.log("→ Postgres detected: deploying with durable Postgres storage.");
  run("node scripts/use-db.mjs postgres");
  run("npx prisma generate");
  run("npx prisma db push --skip-generate", { DATABASE_URL: directUrl });
  run("next build", { DATABASE_URL: runtimeUrl });
} else {
  console.log("→ No Postgres: building self-contained SQLite demo (data is ephemeral).");
  // SQLite paths resolve relative to the schema dir (prisma/), so this writes
  // prisma/build.db (what src/lib/prisma.ts + output tracing expect).
  const buildDb = "file:./build.db";
  run("node scripts/use-db.mjs sqlite");
  run("npx prisma generate");
  run("npx prisma db push --skip-generate", { DATABASE_URL: buildDb });
  run("npx tsx prisma/seed.ts", { DATABASE_URL: buildDb });
  run("next build");
}
