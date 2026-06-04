-- Allow branch managers to list and edit staff in their branch on Admin page.
-- Without this, RLS only permits reading your own profile (auth.uid() = id).

create policy "Managers read branch staff profiles" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role = 'manager'
        and me.branch_id is not null
        and me.branch_id = profiles.branch_id
        and profiles.role = 'staff'
    )
  );

create policy "Managers update branch staff profiles" on public.profiles
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role = 'manager'
        and me.branch_id is not null
        and me.branch_id = profiles.branch_id
        and profiles.role = 'staff'
    )
  )
  with check (
    profiles.role = 'staff'
    and profiles.branch_id = (
      select me.branch_id from public.profiles me where me.id = auth.uid()
    )
  );
