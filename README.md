# Turfie — multi-sport turf booking website

A production-shaped implementation of the **Turfie** design (exported from Claude
Design) as a real **Next.js (App Router) + TypeScript** full-stack app: marketing
pages, the full booking flow with a **10-minute slot-lock**, auth, account,
my-bookings, refunds, and a partner admin dashboard. Currency is **₹ INR**;
venues are around Nalasopara / Vasai-Virar, with brand-level copy reading
"across Maharashtra".

Built on the Turfie Design System tokens (lime "Turf Green" `#9fe870`, olive ink,
sage canvas; Manrope display + Inter body).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript |
| Styling | Design-system CSS variables in `globals.css` + Tailwind v4 (utilities) |
| Database | Prisma 6 — **SQLite** in dev (zero-setup), swap to Postgres for prod |
| Auth | JWT session cookie (`jose`) + bcrypt password hashing |
| Slot locks | DB-backed `SlotLock` rows with TTL (Redis-ready interface) |
| Payments | Razorpay (REST) behind an interface, with a simulated PSP fallback |
| Maps | Google Maps embed (keyless by default; keyed when a key is set) |

## Getting started

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET (any random string for dev)
npm run db:push             # create the SQLite schema
npm run db:seed             # seed 8 turfs, reviews, demo user + bookings
npm run dev                 # http://localhost:3000
```

Production:

```bash
npm run build && npm run start
```

**Demo account:** `aarav@turfie.in` / `turfie123` (or sign up for a new one).

## What's implemented

**Marketing** — Home (hero booking widget), How it works, Pricing, List your
turf, About, Help (searchable FAQ), Contact (tel:/mailto: channels).

**Booking flow** — Browse (filters + map + geolocation distance sort), Court
detail (amenities, live map + directions, reviews, favourite, share sheet),
Booking (field → date → duration → slot with **2-hour-consecutive** logic),
Checkout (hold countdown, phone-or-email required, split calculator, payment),
Confirmation (confetti).

**Account** — Auth (login/signup, gated routes), Account, My Bookings (cancel
with tiered-refund confirm + reschedule modal), Saved turfs, Refund tracking
(4-stage tracker).

**Partner admin** (`/admin`) — KPIs, turf-performance table, 7-day revenue
chart, latest-bookings feed (fed by real recent bookings), bookings ledger.

### Core mechanics (real backend)

- **Slot lock** — selecting a slot doesn't lock anything; the 10-minute hold is
  created on **"Continue to pay"** via `POST /api/locks`, which atomically
  refuses slots held by another session (HTTP 409). Other sessions see the slot
  as *held* with a live countdown. Payment success consumes the hold;
  `GET /api/availability` merges confirmed bookings + active foreign holds +
  a deterministic demo-busy set. Implemented in `src/lib/locks.ts`
  (1:1 with the Redis `SET NX PX 600000` contract documented inline).
- **Refund policy** — >24h before kick-off → 100%; 4–24h → 50%; <4h → 0%
  (`refundQuote` in `src/lib/content.ts`).
- **Reschedule** — 5 free per calendar month, then ₹50 (`src/lib/reschedule.ts`).

## Project layout

```
src/
  app/
    (routes)                 home, browse, turf/[id], turf/[id]/book, checkout,
                             booking/confirmed, login, signup, account/*, admin
    api/                     auth, availability, locks, checkout/order,
                             bookings, bookings/[id], reschedule-status
  components/
    ui/                      Button/Card/Badge/Chip/Input, Icon, Dropdown, Map,
                             TurfCard, Modal, layout bits (Display/Container/…)
    chrome/                  TopNav, Footer, SiteChrome
    providers/               session, toast, share
    screens/                 one component per page/view
  lib/                       prisma, auth, locks, availability, payments,
                             reschedule, turfs, bookings, content, format, maps
prisma/                      schema.prisma, seed.ts
```

## Optional integrations

All work with zero config (sensible fallbacks); set keys in `.env` to go live:

- **Social sign-in (Google / Apple)** — set the provider env vars (see
  `.env.example`) and the login buttons activate automatically. Flow:
  `GET /api/auth/oauth/{provider}` (state cookie + redirect) →
  `/api/auth/callback/{provider}` (state check, code→token exchange, user upsert,
  session). Google id_tokens are verified against Google's JWKS; Apple uses an
  ES256 client-secret JWT and the `form_post` callback. Redirect URIs:
  `${APP_URL}/api/auth/callback/google` and `…/apple`.
- **Razorpay** — set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` /
  `NEXT_PUBLIC_RAZORPAY_KEY_ID` to take real payments (server creates the order,
  the client opens Razorpay checkout, the server verifies the signature). Without
  keys, checkout uses a simulated PSP so the flow is fully demoable.
- **Google Maps** — set `NEXT_PUBLIC_GOOGLE_MAPS_KEY` to use the keyed Embed API.
- **Redis slot locks** — set `REDIS_URL` and holds use Redis (`SET NX PX`,
  per-hour keys + an owner index set); otherwise the DB lock table is used. Same
  interface either way (`src/lib/locks.ts`).
- **Postgres** — `npm run db:postgres` flips the Prisma provider; set
  `DATABASE_URL` to your Postgres URL, then `npm run db:migrate` (or `db:push`)
  and `npm run db:seed`. `npm run db:sqlite` switches back.

### Production-parity dev with Docker

```bash
docker compose up -d        # Postgres + Redis
npm run db:postgres         # flip Prisma provider to postgresql
# set DATABASE_URL + REDIS_URL in .env (see docker-compose.yml header)
npm run db:migrate && npm run db:seed
npm run dev
```

## Scripts

`dev` · `build` · `start` · `lint` · `db:push` · `db:seed` · `db:migrate` ·
`db:sqlite` · `db:postgres`

## Notes / fidelity

- The court "art" headers and the Browse SVG map are intentional brand
  stand-ins (no photography), exactly as the design export specifies. Swap in
  real venue photos / the keyed Maps JS API for production.
- Social login (Google/Apple) is fully implemented; it activates when the
  provider env vars are set (otherwise the buttons explain they need keys).
- Turf names/areas are real public venues; ratings, prices and inventory are
  illustrative demo values.
