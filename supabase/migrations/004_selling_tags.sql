-- Selling points as reusable #tags (per branch)
-- Run AFTER 003_multi_branch_roles.sql

alter table public.bikes
  add column if not exists selling_tags text[] not null default '{}';

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references public.branches(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (branch_id, name)
);

alter table public.tags enable row level security;

drop policy if exists "Staff branch read tags" on public.tags;
drop policy if exists "Staff branch insert tags" on public.tags;

create policy "Staff branch read tags" on public.tags
  for select to authenticated
  using (
    branch_id = (select p.branch_id from public.profiles p where p.id = auth.uid())
  );

create policy "Staff branch insert tags" on public.tags
  for insert to authenticated
  with check (
    branch_id = (select p.branch_id from public.profiles p where p.id = auth.uid())
  );

