-- ─────────────────────────────────────────────────────────────────────────
-- 0003_users
-- public.users (extends auth.users), public.user_settings,
-- public.user_locations, plus the auth → public sync trigger and
-- the is_admin() helper used by other RLS policies.
-- PRD §4 / §6.6 / §9.
-- ─────────────────────────────────────────────────────────────────────────

-- ── users (Profile + Auth-Verknüpfung) ─────────────────────────────────
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  auth_provider   public.auth_provider not null default 'email',
  first_name      text,
  last_name       text,
  email           citext unique,
  username        citext unique,                       -- für QR / Deep-Link Add (PRD §6.6)
  avatar_url      text,
  -- phone_hash matched dieselbe SHA-256+Salt-Konvention wie contacts.phone_hash
  -- (PRD §11.2). Eindeutig, damit der Index das Hash-Lookup beim Kontakt-Sync
  -- in O(1) macht.
  phone_hash      text unique,
  role            public.user_role not null default 'user',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index users_phone_hash_idx on public.users(phone_hash) where phone_hash is not null;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ── user_settings ──────────────────────────────────────────────────────
create table public.user_settings (
  user_id              uuid primary key references public.users(id) on delete cascade,
  share_location       boolean not null default true,         -- PRD §6.6
  mutual_min_friends   smallint not null default 10,          -- Mutual-Filter (PRD §6.3 / §6.6)
  notification_prefs   jsonb not null default jsonb_build_object(
    'invite', true,
    'reschedule', true,
    'new_in_orbit_home', false,                                -- Default off für Heimat (PRD §6.2)
    'new_in_orbit_current', true,
    'new_signup', true,
    'trip_overlap', true
  ),
  locale               text not null default 'de',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

-- ── user_locations (PRD §6.6 / §11.1 — KEINE Koordinaten) ──────────────
create table public.user_locations (
  user_id       uuid primary key references public.users(id) on delete cascade,
  orbit_id      uuid not null references public.orbits(id) on delete restrict,
  last_seen_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index user_locations_orbit_idx on public.user_locations(orbit_id);
create index user_locations_last_seen_idx on public.user_locations(last_seen_at desc);

create trigger user_locations_set_updated_at
before update on public.user_locations
for each row execute function public.set_updated_at();

comment on table public.user_locations is
  'PRD §11.1 — Aktueller Orbit pro User. Niemals Koordinaten; nur orbit_id.';

-- ── Auth → public.users Sync-Trigger ────────────────────────────────────
-- Beim Signup via Supabase Auth (Apple/Google/Email) automatisch profile +
-- settings anlegen. Apple und Google liefern den Namen in raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider public.auth_provider;
begin
  v_provider := case
    when new.raw_app_meta_data->>'provider' = 'apple'  then 'apple'::public.auth_provider
    when new.raw_app_meta_data->>'provider' = 'google' then 'google'::public.auth_provider
    when new.is_anonymous = true                       then 'anonymous'::public.auth_provider
    else 'email'::public.auth_provider
  end;

  insert into public.users (id, email, first_name, last_name, auth_provider, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'given_name',
      split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'family_name',
      nullif(
        substring(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '') from position(' ' in coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))+1),
        ''
      )
    ),
    v_provider,
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Beim Email-Update in auth.users im public.users-Profil mitziehen.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.users set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_change on auth.users;
create trigger on_auth_user_email_change
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ── is_admin() helper ──────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.users
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ── RLS: users ─────────────────────────────────────────────────────────
alter table public.users enable row level security;

-- Eigenes Profil immer lesbar.
create policy "users: read own"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

-- Profile von Mutuals lesbar — kommt in 0004 nachdem friend_links existiert
-- (additive policy, hinzugefügt mit alter policy / create policy dort).

-- Admins lesen alles.
create policy "users: admin read"
  on public.users for select
  to authenticated
  using (public.is_admin());

-- Eigenes Profil aktualisieren (außer role — siehe Trigger).
create policy "users: update own"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Ein normaler User darf seine role NICHT ändern. Admin-Updates und
-- service_role-Updates (auth.uid() is null) sind erlaubt.
create or replace function public.protect_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'role can only be changed by admins';
  end if;
  return new;
end;
$$;

create trigger users_protect_role
before update of role on public.users
for each row execute function public.protect_user_role();

-- Admins lesen/schreiben/löschen alles.
create policy "users: admin update"
  on public.users for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "users: admin delete"
  on public.users for delete
  to authenticated
  using (public.is_admin());

-- Inserts laufen über den auth-trigger (security definer). Direktes INSERT
-- aus Client-Code wird nicht erlaubt — keine INSERT-Policy.

-- Self-delete erlaubt (DSGVO §11.3 — Cascade übernimmt der Rest).
create policy "users: delete own"
  on public.users for delete
  to authenticated
  using ((select auth.uid()) = id);

-- ── RLS: user_settings ─────────────────────────────────────────────────
alter table public.user_settings enable row level security;

create policy "user_settings: read own"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_settings: update own"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_settings: insert own"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- ── RLS: user_locations ────────────────────────────────────────────────
alter table public.user_locations enable row level security;

-- Eigenen Standort lesen/schreiben.
create policy "user_locations: read own"
  on public.user_locations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_locations: upsert own"
  on public.user_locations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_locations: update own"
  on public.user_locations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_locations: delete own"
  on public.user_locations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Standorte von Mutuals werden über den friend_links-Helper sichtbar — Policy
-- wird in 0004_contacts_friends.sql nachgereicht.

-- ── Orbits write-policies (jetzt wo is_admin() existiert) ──────────────
create policy "orbits: admin write"
  on public.orbits for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
