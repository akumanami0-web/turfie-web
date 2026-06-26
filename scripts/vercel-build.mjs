// Vercel build entrypoint.
// • If DATABASE_URL is Postgres → switch Prisma to postgres, push schema, build.
// • Otherwise → build a self-contained SQLite demo: generate a seeded
//   prisma/build.db that ships with the deployment and runs from /tmp at
//   runtime (see src/lib/prisma.ts). Zero external services required.
import { execSync } from "node:child_process";

const run = (cmd, env = {}) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
};

const url = process.env.DATABASE_URL || "";
const isPostgres = /^postgres(ql)?:\/\//.test(url);

if (isPostgres) {
  console.log("→ Postgres detected: deploying with durable Postgres storage.");
  run("node scripts/use-db.mjs postgres");
  run("npx prisma generate");
  run("npx prisma db push --skip-generate");
  run("next build");
} else {
  console.log("→ No Postgres: building self-contained SQLite demo (data is ephemeral).");
  // SQLite paths are resolved relative to the schema dir (prisma/), so this
  // writes prisma/build.db (what src/lib/prisma.ts + tracing expect).
  const buildDb = "file:./build.db";
  run("node scripts/use-db.mjs sqlite");
  run("npx prisma generate");
  run("npx prisma db push --skip-generate", { DATABASE_URL: buildDb });
  run("npx tsx prisma/seed.ts", { DATABASE_URL: buildDb });
  run("next build");
}
