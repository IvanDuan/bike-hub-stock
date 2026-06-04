-- Multi-branch + roles (manager/staff)
-- Run AFTER 001_initial.sql

do $$ begin
  create type staff_role as enum ('manager', 'staff');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.branches (
  id text primary key,
  name text not null
);

insert into public.branches (id, name) values
  ('mt-roskill', 'Bike Hub Mount Roskill'),
  ('new-lynn', 'Bike Hub New Lynn')
on conflict (id) do update set name = excluded.name;

alter table public.profiles
  add column if not exists role staff_role not null default 'staff',
  add column if not exists branch_id text references public.branches(id);

alter table public.bikes
  add column if not exists branch_id text references public.branches(id);

-- For existing rows (if any), default to Mt Roskill
update public.bikes set branch_id = 'mt-roskill' where branch_id is null;

-- Refresh policies for profiles: only allow reading/updating your own profile
alter table public.branches enable row level security;

drop policy if exists "Staff read profiles" on public.profiles;
drop policy if exists "Staff update own profile" on public.profiles;
drop policy if exists "Staff insert own profile" on public.profiles;

create policy "Staff read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "Staff update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Staff insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Staff can read branches list
drop policy if exists "Staff read branches" on public.branches;
create policy "Staff read branches" on public.branches
  for select to authenticated using (true);

-- Bikes are partitioned by branch_id in the user's profile
drop policy if exists "Staff full access bikes" on public.bikes;
create policy "Staff branch access bikes" on public.bikes
  for all to authenticated
  using (
    branch_id = (select p.branch_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    branch_id = (select p.branch_id from public.profiles p where p.id = auth.uid())
  );

-- Photos are tied to bikes; bikes policy ensures branch scoping
drop policy if exists "Staff full access photos" on public.bike_photos;
create policy "Staff branch access photos" on public.bike_photos
  for all to authenticated
  using (
    exists (
      select 1 from public.bikes b
      where b.id = bike_id
        and b.branch_id = (select p.branch_id from public.profiles p where p.id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.bikes b
      where b.id = bike_id
        and b.branch_id = (select p.branch_id from public.profiles p where p.id = auth.uid())
    )
  );

-- Public browse remains: only available/refurb, across all branches for now
-- (If you want branch-specific public pages later, we can add a branch filter.)

-- Update profile-on-signup to set role and leave branch_id null (admin sets branch + role).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

