# Supabase production setup — Bike Hub Mount Roskill

Follow these steps once to connect the app to live shared data.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Choose a name (e.g. `bike-hub-stock`), set a database password, pick a region close to NZ (e.g. Sydney)

## 2. Run the database migration

1. Open **SQL Editor** → **New query**
2. Paste the contents of `supabase/migrations/001_initial.sql`
3. Click **Run**

## 3. Create the photo storage bucket

1. Go to **Storage** → **New bucket**
2. Name: `bike-photos`
3. Enable **Public bucket**
4. Back in **SQL Editor**, run the storage policy block at the bottom of `001_initial.sql` (uncomment those lines first)

## 4. Configure staff auth

1. Go to **Authentication** → **Providers** → ensure **Email** is enabled
2. **Authentication** → **Users** → **Invite user** for each staff member (5–6 emails)
3. Optional: **Authentication** → **Settings** → disable **Enable sign ups** so only invited staff can join
4. **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (for local dev) — add `https://bike-hub-stock.vercel.app` when deploying
   - **Redirect URLs** (add all that apply):
     - `http://localhost:3000/login`
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3000/auth/callback`
     - `https://bike-hub-stock.vercel.app/login`
     - `https://bike-hub-stock.vercel.app/auth/confirm`
     - `https://bike-hub-stock.vercel.app/auth/callback`
5. **Authentication** → **Email Templates** → **Invite user** — replace the link with:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Accept invite</a>
   ```
   (Or replace `{{ .ConfirmationURL }}` in the template body with that URL.)

### Accepting an invite

When a staff member clicks the invite link in their email:

1. They land on `/auth/confirm`, which verifies the link
2. The app redirects to `/login?setup=password`
3. They choose a password (8+ characters), then continue into the app
4. Next time, sign in with email + password on `/login`

If the link expired, ask an admin to send a new invite from Supabase → Authentication → Users.

## 5. Add environment variables locally

Copy the example file and fill in values from **Project Settings** → **API**:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server:

```bash
npm run dev
```

Sign in with a staff email you invited (check inbox for password setup link).

## 6. Add environment variables on Vercel

1. [vercel.com](https://vercel.com) → your **bike-hub-stock** project → **Settings** → **Environment Variables**
2. Add the same two variables for **Production**, **Preview**, and **Development**
3. **Redeploy** (Deployments → … → Redeploy)

## 7. Verify

| Check | Expected |
|-------|----------|
| Staff login | Real email + password works |
| Add bike + photo | Visible to all staff |
| `/browse` (logged out) | Shows available + refurb bikes |
| Demo banner | Gone when Supabase env vars are set |

## Security notes

- **Staff data** (all statuses, notes, sold prices): authenticated users only
- **Public browse**: only `available` and `refurb` bikes — no internal notes exposed on customer cards
- **Photos**: public read from `bike-photos` bucket (needed for customer page)
- Never commit `.env.local` or share the `service_role` key in the frontend

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Invalid login credentials" | User must accept invite and set password in Supabase email |
| Invite link expired (`otp_expired`) | Send a **new invite** from Supabase → Authentication → Users. Old links stop working after ~1 hour. Sign-in will fail until a new invite is completed. |
| **Email rate limit exceeded** | Default Supabase email allows ~**2 auth emails/hour**. Wait ~1 hour, or **skip email entirely**: delete the user → **Add user** with email + password + **Auto Confirm User** checked. For production, set up custom SMTP (Resend/SendGrid) under Authentication → SMTP. |
| No “Set password” screen | Link expired or was already used — request a new invite |
| Photo upload fails | Check `bike-photos` bucket exists and storage policies are applied |
| Browse page empty | Add bikes with status Available/Refurb; check public RLS policies ran |
| Still shows demo banner | Env vars missing — restart dev server / redeploy Vercel |
