// Switch the Prisma datasource provider between sqlite (dev) and postgresql (prod).
//   node scripts/use-db.mjs sqlite
//   node scripts/use-db.mjs postgres
// Prisma requires the provider to be a literal in schema.prisma, so we rewrite it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const target = (process.argv[2] || "").toLowerCase();
const provider = target === "postgres" || target === "postgresql" ? "postgresql" : target === "sqlite" ? "sqlite" : null;
if (!provider) {
  console.error("Usage: node scripts/use-db.mjs <sqlite|postgres>");
  process.exit(1);
}

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "schema.prisma");
const src = readFileSync(schemaPath, "utf8");
const next = src.replace(/(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"(sqlite|postgresql)"/m, `$1"${provider}"`);
if (next === src && !src.includes(`provider = "${provider}"`)) {
  console.error("Could not find the datasource provider line to rewrite.");
  process.exit(1);
}
writeFileSync(schemaPath, next);
console.log(`Prisma datasource provider set to "${provider}".`);
console.log(provider === "postgresql"
  ? "Next: set DATABASE_URL to your Postgres URL, then `npx prisma migrate dev` (or `db push`)."
  : "Next: `npm run db:push && npm run db:seed`.");
