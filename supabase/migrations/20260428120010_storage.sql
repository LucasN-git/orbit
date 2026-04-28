-- ─────────────────────────────────────────────────────────────────────────
-- 0010_storage
-- Storage-Buckets + Policies. PRD §8.2 — Storage für Profilbilder,
-- Location-Bilder, CMS-Assets.
-- ─────────────────────────────────────────────────────────────────────────

-- Buckets anlegen (idempotent).
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('cms-assets', 'cms-assets', true),
  ('location-images', 'location-images', true)
on conflict (id) do nothing;

-- ── avatars ────────────────────────────────────────────────────────────
-- Konvention: Pfad beginnt mit auth.uid() (z.B. '<uuid>/avatar.jpg').
-- Storage-Policies arbeiten auf storage.objects, RLS dort ist standardmäßig
-- aktiv.

drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars: owner write" on storage.objects;
create policy "avatars: owner write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ── cms-assets ─────────────────────────────────────────────────────────
drop policy if exists "cms-assets: public read" on storage.objects;
create policy "cms-assets: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'cms-assets');

drop policy if exists "cms-assets: admin write" on storage.objects;
create policy "cms-assets: admin write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'cms-assets' and public.is_admin())
  with check (bucket_id = 'cms-assets' and public.is_admin());

-- ── location-images ────────────────────────────────────────────────────
drop policy if exists "location-images: public read" on storage.objects;
create policy "location-images: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'location-images');

drop policy if exists "location-images: admin write" on storage.objects;
create policy "location-images: admin write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'location-images' and public.is_admin())
  with check (bucket_id = 'location-images' and public.is_admin());
