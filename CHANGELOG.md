# Changelog

All notable changes to Bike Hub Stock are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — 2026-06-03

Multi-branch staff app, admin invites, AI bike intake, richer customer browse, and production auth/env setup. Compared to **v0.1** (initial Vercel deploy: single Mt Roskill hub).

### Added

- **Multi-branch support** — Mt Roskill and New Lynn (`BRANCHES`, `branch_id` on bikes and profiles).
- **Roles** — SuperAdmin, Branch manager (`manager` in DB), and Staff with route-level access control.
- **Admin** (`/admin`) — View/edit staff branch and role; **Send invite** via `/api/admin/invite` (requires `SUPABASE_SERVICE_ROLE_KEY`).
- **Account** (`/account`) — Update display name, email, and password.
- **AI add-bike** — Photo → suggested fields via `/api/ai/bike` (requires `OPENAI_API_KEY`); re-run AI and editable fields on add-bike page.
- **Selling tags** — `#tags` on bikes, tag suggestions table, `TagInput` component; migration `004_selling_tags.sql`.
- **Customer browse** — Search, type/price/tag filters, category tabs; branch badges on cards.
- **Visit copy** — “Test rides welcome” with **per-hub street addresses** (replaces “message us to view or reserve”).
- **Pull-to-refresh** on Home, Stats, and Promote; refetch when app returns to foreground.
- **PWA** — `manifest.ts`, app icons, Apple touch icon, standalone meta tags.
- **Branding** — `BikeHubTheme` (hero, patterns, service strip), community map on login, SVG bottom-nav icons.
- **Header menu** — Account, admin (when allowed), share browse link, sign out.
- **Env / deploy** — `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` for invite redirects; documented in `.env.local.example` and `SUPABASE.md`.
- **SQL** — `003_multi_branch_roles.sql` (branches, roles, RLS per branch).
- **Helpers** — `branch-auth.ts`, `app-url.ts`, `buildPromoDescription()` / `testRideVisitLine()` in `facebook-post.ts`.

### Changed

- **Header** — Yellow location line follows logged-in branch (not always “Mount Roskill”).
- **Login** — Branch dropdown; validation before session; improved invite / set-password flow.
- **Home** — Category tabs (all / adult / kids); simplified filters vs v0.1.
- **Bike detail** — Auto promo description from tags/metadata; **removed** manual Facebook description and post fields.
- **Facebook posts** — Generated copy uses selling tags, type, color, and hub address CTA.
- **Stats** — Hidden from plain staff; managers and superadmins only.
- **Bottom nav** — Custom SVG icons; Stats tab gated by role.
- **App shell** — `document.title` uses branch name; branch mismatch logout if local branch ≠ profile.
- **Browse footer** — Lists both hub addresses.
- **Supabase auth URLs** — Documented for port **3001**, LAN IP, and Vercel production domains.

### Fixed

- Invite links pointing at wrong host/port (`localhost:3000` vs app on **3001** / phone LAN).
- Login stuck on “Completing invitation…” when already signed in.
- Pull-to-refresh not refetching (stable `refresh` callbacks, visibility refetch).
- iOS PWA layout issues from overly strict viewport scroll locking (reverted to safer layout).

### Deployment notes (v0.2)

Redeploy Vercel and set:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client API |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin staff invites |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | Optional AI intake |

Run migrations **003** and **004** in Supabase. Update **Authentication → URL Configuration** (Site URL + redirect URLs) to match your Vercel domain.

---

## [0.1.0] — Initial release (Vercel baseline)

First production-oriented release: **Bike Hub Mount Roskill** only.

### Included

- **Staff app** (login required) — Dashboard/stock list, add bike with photo, bike detail workflow (donated → refurb → available → reserved → sold), Promote (Facebook copy), Sold archive, Stats.
- **Demo mode** — LocalStorage when Supabase env vars are missing.
- **Customer browse** (`/browse`) — Public list of available and in-refurb bikes; no login.
- **Supabase** — `001_initial.sql`, `bike-photos` storage, email auth, staff invites via dashboard.
- **Deploy** — Vercel + Supabase; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **UX** — Mobile-first UI, emoji bottom nav, share browse link in header, basic Bike Hub branding.

### Limitations (addressed in v0.2)

- Single shop name and header (Mount Roskill only).
- No branch or role model in the app.
- No in-app staff invite API.
- Manual listing / Facebook text on bike detail.
- No AI intake, selling tags, or advanced browse filters.
- No PWA manifest or multi-hub customer addresses.
