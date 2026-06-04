-- Fix infinite recursion: policies on profiles must not subquery profiles under RLS.
-- Use security definer helpers that bypass RLS when reading the current user's row.

create or replace function public.auth_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.auth_profile_branch_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.auth_is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_profile_role() = 'superadmin', false);
$$;

create or replace function public.auth_is_branch_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_profile_role() = 'manager', false);
$$;

revoke all on function public.auth_profile_role() from public;
revoke all on function public.auth_profile_branch_id() from public;
revoke all on function public.auth_is_superadmin() from public;
revoke all on function public.auth_is_branch_manager() from public;
grant execute on function public.auth_profile_role() to authenticated;
grant execute on function public.auth_profile_branch_id() to authenticated;
grant execute on function public.auth_is_superadmin() to authenticated;
grant execute on function public.auth_is_branch_manager() to authenticated;

-- Replace recursive profile policies
drop policy if exists "Managers read branch staff profiles" on public.profiles;
drop policy if exists "Managers update branch staff profiles" on public.profiles;
drop policy if exists "Superadmin read all profiles" on public.profiles;
drop policy if exists "Superadmin update all profiles" on public.profiles;

create policy "Profiles select own superadmin or branch staff" on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or public.auth_is_superadmin()
    or (
      public.auth_is_branch_manager()
      and public.auth_profile_branch_id() is not null
      and branch_id = public.auth_profile_branch_id()
      and role = 'staff'
    )
  );

create policy "Profiles update own superadmin or branch staff" on public.profiles
  for update to authenticated
  using (
    auth.uid() = id
    or public.auth_is_superadmin()
    or (
      public.auth_is_branch_manager()
      and public.auth_profile_branch_id() is not null
      and branch_id = public.auth_profile_branch_id()
      and role = 'staff'
    )
  )
  with check (
    auth.uid() = id
    or public.auth_is_superadmin()
    or (
      role = 'staff'
      and branch_id = public.auth_profile_branch_id()
    )
  );

-- Bikes / photos / tags: avoid profiles subquery recursion for superadmin
drop policy if exists "Superadmin full access bikes" on public.bikes;
drop policy if exists "Superadmin full access photos" on public.bike_photos;
drop policy if exists "Superadmin full access tags" on public.tags;

create policy "Superadmin full access bikes" on public.bikes
  for all to authenticated
  using (public.auth_is_superadmin())
  with check (public.auth_is_superadmin());

create policy "Superadmin full access photos" on public.bike_photos
  for all to authenticated
  using (public.auth_is_superadmin())
  with check (public.auth_is_superadmin());

create policy "Superadmin full access tags" on public.tags
  for all to authenticated
  using (public.auth_is_superadmin())
  with check (public.auth_is_superadmin());
