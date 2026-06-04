# Bike Hub Stock

Mobile-first inventory app for **Bike Hub Mount Roskill** — track donated bikes, refurb status, sales, and Facebook promotion posts.

## Quick start (demo mode)

No Supabase needed to try v1 locally:

```bash
cd ~/Projects/bike-hub-stock
npm install
npm run dev          # laptop only — light on CPU
npm run dev:lan      # phone on same Wi‑Fi → http://YOUR_LAPTOP_IP:3001
```

Open [http://localhost:3000](http://localhost:3000) on your laptop.

**Demo login:** any email with `@` and any password, e.g. `demo@bikehub.local` / `demo`

Demo data is saved in your browser (localStorage). The yellow banner reminds you it's demo mode.

### Customer browse page

Share this link with customers (Facebook, email, etc.):

```
https://your-domain.com/browse
```

Locally: `http://localhost:3000/browse` (or `:3001` if using `npm run dev:lan`)

Staff can tap **Share shop link** in the blue header to copy the URL.

Shows **Available now** and **In the workshop** (refurb) bikes — no login required. In production with Supabase, all customers see the same live stock (see migration SQL for public read policies).

### Dev server feels slow?

If `npm run dev` makes your laptop laggy, you likely have a stray `package-lock.json` in your home folder (`~/package-lock.json`). Next.js was scanning your whole home directory. This project pins its root in `next.config.ts` and uses `--webpack` for lighter dev. For phone testing, use `npm run dev:lan` only when needed.

## Production setup (Supabase — 5–6 staff on phones)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial.sql` in the SQL Editor
3. Create a **public** storage bucket named `bike-photos`
4. Add storage policies from the comments at the bottom of the migration file
5. Copy `.env.local.example` → `.env.local` and fill in your keys
6. In Supabase Auth, invite each staff member by email (disable public signup)
7. Deploy to [Vercel](https://vercel.com) and add the same env vars

```bash
cp .env.local.example .env.local
npm run build
npm start
```

See [CHANGELOG.md](./CHANGELOG.md) for version history (current: **v0.2.0**).

## Features (v0.2)

- **Dashboard** — available, in refurb, ready to post, sold this month
- **Stock** — search and filter by status
- **Add bike** — camera photo + intake form (starts as Donated)
- **Bike detail** — status workflow, asking price when listing, sold price when sold
- **Promote** — Facebook-ready posts for available bikes with photos
- **Sold** — archive with negotiated pricing notes

## Facebook workflow

1. Open **Promote**
2. Copy the generated post text
3. Save/share the bike photo to Facebook manually
4. Tap **Posted** so it won't appear again for 7 days

## Project structure

```
src/app/(app)/     Main app screens (auth required)
src/app/login/     Staff login
src/lib/           Types, constants, demo store, Supabase clients
supabase/          SQL migration for production
```

## Shop details baked in

- Shop name: **Bike Hub Mount Roskill**
- Brand colors: blue `#0056A4`, yellow `#FFD700`, green `#5BA467`
- List price set when a bike becomes Available
- Prices shown as **negotiable** on Facebook posts
