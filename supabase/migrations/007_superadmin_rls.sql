-- Superadmin RLS (run after 006_superadmin_role.sql has committed).

create policy "Superadmin read all profiles" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  );

create policy "Superadmin update all profiles" on public.profiles
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  );

create policy "Superadmin full access bikes" on public.bikes
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  );

create policy "Superadmin full access photos" on public.bike_photos
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  );

create policy "Superadmin full access tags" on public.tags
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'superadmin'
    )
  );
