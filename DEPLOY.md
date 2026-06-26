# Deploying Turfie

The app is Vercel-ready. A serverless host needs **Postgres** (the SQLite dev DB
can't run on a read-only serverless filesystem), so the steps below use a free
Neon/Vercel Postgres. The repo's `vercel-build` script handles the rest:
it switches Prisma to Postgres, generates the client, pushes the schema, and
builds.

## 1. Get the code onto a Git host
This sandbox has no push credentials, so push from your own machine (or let me
push if you add a remote + token):

```bash
cd turfie-web
git init && git add -A && git commit -m "Turfie web app"
git remote add origin https://github.com/<you>/turfie-web.git
git push -u origin main
```

## 2. Create a Postgres database
Use **Neon** (neon.tech), **Vercel Postgres**, or **Supabase** — all have free
tiers. Copy the connection string (include `?sslmode=require`), e.g.:

```
postgresql://USER:PASSWORD@HOST/turfie?sslmode=require
```

## 3. Import the repo on Vercel
- vercel.com → **Add New → Project** → import your GitHub repo.
- Framework preset: **Next.js** (auto). Build command is auto-detected from the
  `vercel-build` script — leave it as is.
- Add **Environment Variables**:

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | your Postgres URL from step 2 |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `APP_URL` | recommended | your deploy URL, e.g. `https://turfie.vercel.app` |
| `REDIS_URL` | optional | Upstash Redis URL (else DB-backed locks) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | optional | real payments (else simulated) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | optional | keyed Maps embed |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Google sign-in |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | optional | Apple sign-in |

- Click **Deploy**. The build runs `prisma db push` against your Postgres, so the
  schema is created automatically.

## 4. Seed demo data (once)
From your machine, pointed at the production DB:

```bash
npm run db:postgres
DATABASE_URL="<your prod postgres url>" npm run db:seed
```

This loads the 8 turfs, reviews, and the demo account (`aarav@turfie.in` /
`turfie123`). Skip this for a clean, empty production instance.

## 5. OAuth redirect URIs (if using social login)
Register these in the Google/Apple consoles:
- `https://<your-domain>/api/auth/callback/google`
- `https://<your-domain>/api/auth/callback/apple`

That's it — the same code runs locally on SQLite and in production on Postgres.
