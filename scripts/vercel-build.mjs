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

// synchronous sleep without busy-spinning (build script is sequential)
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

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

  // Push the schema. Supabase's *direct* connection (db.<ref>.supabase.co) is
  // IPv6-only on many projects and unreachable from the Vercel builder, so we
  // try the direct URL first and fall back to the pooled (IPv4) URL, each with
  // a couple of retries. --accept-data-loss keeps an additive change from
  // aborting on an interactive prompt in CI.
  const candidates = [];
  for (const [label, url] of [["direct", directUrl], ["pooled", runtimeUrl]]) {
    if (isPg(url) && !candidates.some((c) => c.url === url)) candidates.push({ label, url });
  }
  let pushedUrl = null;
  outer: for (const { label, url } of candidates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`→ prisma db push via ${label} connection (attempt ${attempt})`);
        run("npx prisma db push --skip-generate --accept-data-loss", { DATABASE_URL: url });
        pushedUrl = url;
        break outer;
      } catch (e) {
        console.warn(`db push (${label}, attempt ${attempt}) failed: ${e?.message || e}`);
        if (attempt < 2) sleep(3000);
      }
    }
  }
  if (!pushedUrl) throw new Error("prisma db push failed on all Postgres connection URLs");

  // Seed turfs + reviews (idempotent upserts) so the venue catalog is present
  // on first deploy. Never creates user accounts — sign-up is real.
  try {
    run("npx tsx prisma/seed.ts", { DATABASE_URL: pushedUrl });
  } catch (e) {
    console.warn("seed skipped/failed (non-fatal):", e?.message || e);
  }
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
