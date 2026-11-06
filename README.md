# NetShop

A demo e-commerce storefront for Wi-Fi ISP (WISP) networking equipment — outdoor radios,
antennas, managed PoE switches, fiber transceivers, cabling, towers/mounts, surge protection,
power/solar backup, and install tools — styled as a Kilimall-style marketplace (vivid
orange/red branding, hero carousel, flash-sale countdown, category icon grid) and priced in
Kenyan Shillings (KES).

Built with Astro (SSR) + React islands + Tailwind CSS v4, Prisma + SQLite, and hand-rolled
session auth. Checkout offers a simulated card payment and **Cash on Delivery**; there is no
live payment gateway behind either option.

## ⚠️ Demo data notice

The product catalog in `prisma/seed-data.ts` is entirely fictional: invented brand names
(Northbeam, Vantage RF, Coremast, Ridgeline, Haloware, Trueline, Outpost, Sumit Power, Meridian),
placeholder specs and USD-reference pricing (converted to KES at seed time via `USD_TO_KES_RATE`
in `prisma/seed.ts`), and procedurally generated SVG placeholder images. **Do not use real
manufacturer names, logos, or copyrighted product photos** — replace this seed data with
supplier-licensed data and real photography before operating a real storefront. Admins can
upload real product photos (JPEG/PNG/WebP) per product from `/admin/products/[id]`; see
`src/lib/uploads.ts` for how local-disk storage works and its limits on serverless hosting.

## Getting started

```sh
npm install
cp .env.example .env          # DATABASE_URL="file:./prisma/dev.db"
npx prisma migrate dev
npx prisma db seed
npm run dev                    # http://localhost:4321 (or next free port)
```

To verify a production build:

```sh
npm run build
npm run preview -- --port 4500
```

### Demo accounts (seeded)

| Role     | Email                  | Password           |
| -------- | ---------------------- | ------------------- |
| Admin    | admin@netshop.test     | AdminDemo123!        |
| Customer | jordan@example.com     | CustomerDemo123!      |
| Customer | morgan@example.com     | CustomerDemo123!      |

## Project structure

```text
prisma/
  schema.prisma       Database schema (SQLite via Prisma's better-sqlite3 driver adapter)
  seed.ts, seed-data.ts  Seed script + the fictional sample catalog
src/
  actions/            Astro Actions: cart, auth, account, checkout, quote, admin/*
  components/
    islands/           React, client-hydrated (cart drawer, filters, add-to-cart, etc.)
    ui/                 Astro, server-rendered (ProductCard, StockBadge, etc.)
    admin/              Shared admin form components
  layouts/              BaseLayout, ShopLayout, AccountLayout, AdminLayout
  lib/                  db, auth, cart, checkout, catalog, validation, etc.
  middleware.ts         Session resolution + route protection (/account, /admin)
  pages/                File-based routes (storefront, account, admin, checkout, API)
```

## Notable design decisions

- **Money** is stored as integer cents (1/100 shilling) everywhere — never floats. Display
  formatting (`formatCents` in `src/lib/money.ts`) renders whole KES amounts (no decimals), which
  matches how Kenyan retail pricing is normally shown.
- **Orders snapshot** shipping address and item name/sku/price at purchase time, so they stay
  accurate even if a product is later repriced or an address is edited.
- **Specs and bulk-quote line items use fixed-slot forms** (e.g. `spec1.key`/`spec1.value` ...
  `spec8`), not a dynamic repeater — Astro's form-mode action parsing can reconstruct a single
  nested object from `FormData`, but not an array of objects. Empty slots are dropped on save.
- **Cart mutations have two entry points**: the JSON Astro Actions (`cart.add`/`updateQuantity`/
  `remove`) back the JS-driven cart drawer, while `/api/cart/update` and `/api/cart/remove` are
  plain form-POST endpoints so the full `/cart` page works with JavaScript disabled. Astro Actions
  can't share one handler between JSON and `FormData` callers, so these are intentionally separate
  code paths rather than a bug.
- **Checkout** is multi-step (`/checkout` → `/checkout/review` → `/checkout/payment` →
  `/checkout/confirmation/[id]`), with in-progress shipping info held in a short-lived
  `checkout_draft` cookie. The confirmation route is keyed by the order's internal id (not the
  human-readable, sequential order number) so it can't be enumerated.
- **Swapping to Postgres later**: change `provider` in `prisma/schema.prisma` and swap the
  `@prisma/adapter-better-sqlite3` usage in `src/lib/db.ts` for `@prisma/adapter-pg` (or similar),
  then re-run `prisma migrate dev`.
