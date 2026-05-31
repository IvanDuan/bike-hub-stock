-- Bike Hub Mount Roskill — production schema
-- Run in Supabase Dashboard → SQL Editor (New query → Run)

create type bike_status as enum (
  'donated', 'refurb', 'available', 'reserved', 'sold'
);

create type bike_type as enum (
  'road', 'hybrid', 'mtb', 'kids', 'bmx', 'cruiser', 'other'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bikes (
  id uuid primary key default gen_random_uuid(),
  status bike_status not null default 'donated',
  make text not null default '',
  model text not null default '',
  type bike_type not null default 'other',
  frame_size text not null default '',
  color text not null default '',
  condition_notes text not null default '',
  listing_description text not null default '',
  asking_price numeric(10,2),
  sold_price numeric(10,2),
  price_negotiable boolean not null default true,
  donated_at timestamptz,
  listed_at timestamptz,
  sold_at timestamptz,
  last_fb_post_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bike_photos (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now()
);

create index if not exists bikes_status_idx on public.bikes(status);
create index if not exists bikes_updated_at_idx on public.bikes(updated_at desc);
create index if not exists bike_photos_bike_id_idx on public.bike_photos(bike_id);

alter table public.profiles enable row level security;
alter table public.bikes enable row level security;
alter table public.bike_photos enable row level security;

-- Staff (authenticated)
drop policy if exists "Staff read profiles" on public.profiles;
create policy "Staff read profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "Staff update own profile" on public.profiles;
create policy "Staff update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

drop policy if exists "Staff insert own profile" on public.profiles;
create policy "Staff insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Staff full access bikes" on public.bikes;
create policy "Staff full access bikes" on public.bikes
  for all to authenticated using (true) with check (true);

drop policy if exists "Staff full access photos" on public.bike_photos;
create policy "Staff full access photos" on public.bike_photos
  for all to authenticated using (true) with check (true);

-- Public customer browse (anon + authenticated)
drop policy if exists "Public read shop floor bikes" on public.bikes;
create policy "Public read shop floor bikes" on public.bikes
  for select using (status in ('available', 'refurb'));

drop policy if exists "Public read shop floor photos" on public.bike_photos;
create policy "Public read shop floor photos" on public.bike_photos
  for select using (
    exists (
      select 1 from public.bikes b
      where b.id = bike_id and b.status in ('available', 'refurb')
    )
  );

-- Profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- STORAGE (run after creating public bucket "bike-photos" in Dashboard → Storage)
-- insert into storage.buckets (id, name, public) values ('bike-photos', 'bike-photos', true)
--   on conflict (id) do update set public = true;

-- drop policy if exists "Staff upload photos" on storage.objects;
-- create policy "Staff upload photos" on storage.objects
--   for insert to authenticated with check (bucket_id = 'bike-photos');

-- drop policy if exists "Public read photos" on storage.objects;
-- create policy "Public read photos" on storage.objects
--   for select using (bucket_id = 'bike-photos');

-- drop policy if exists "Staff delete photos" on storage.objects;
-- create policy "Staff delete photos" on storage.objects
--   for delete to authenticated using (bucket_id = 'bike-photos');
