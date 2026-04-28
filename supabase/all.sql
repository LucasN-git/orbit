
-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120001_foundation.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0001_foundation
-- Extensions, enums, generic helper functions/triggers used by later files.
-- ─────────────────────────────────────────────────────────────────────────

-- pgcrypto provides gen_random_uuid() and digest() (used for hash demos).
create extension if not exists pgcrypto;
-- citext for case-insensitive usernames/emails.
create extension if not exists citext;

-- ── Enums ───────────────────────────────────────────────────────────────

create type public.auth_provider as enum ('apple', 'google', 'email', 'anonymous');
create type public.user_role as enum ('user', 'admin');
create type public.orbit_type as enum ('city', 'country', 'region');
create type public.friend_status as enum ('mutual', 'pending');
create type public.meetup_status as enum (
  'open',           -- waiting for replies
  'accepted',       -- at least one accepted, time set
  'completed',      -- in the past
  'cancelled'
);
create type public.participant_response as enum (
  'pending',
  'accepted',
  'declined',
  'reschedule'
);
create type public.notification_type as enum (
  'invite',         -- new meetup invite
  'reschedule',     -- existing meetup got a counter-proposal
  'new_in_orbit',   -- contact moved into your orbit
  'new_signup',     -- contact joined orbit
  'trip_overlap'    -- contact's trip overlaps yours
);

-- ── Generic helper: keep updated_at fresh ───────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Generic BEFORE UPDATE trigger to keep an updated_at column current.';

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120002_orbits.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0002_orbits
-- Stammdaten-Tabelle: was zählt als ein „Orbit" (Stadt / Land / Region).
-- CMS-gepflegt via Admin (PRD §6.6, §10.1). Wird vom Reverse-Geocoding-
-- Edge-Function-Lookup verwendet — siehe centroid_lat/lng + bbox.
-- ─────────────────────────────────────────────────────────────────────────

create table public.orbits (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,                -- z.B. 'muenster', 'mallorca'
  name        text not null,                       -- Anzeigename ('Münster')
  type        public.orbit_type not null,
  country_code text,                               -- ISO-3166 alpha-2, z.B. 'DE'
  -- centroid für Reverse-Geocoding-Mapping (PRD §9.1).
  -- Werte sind grob, dienen nur dazu eine eingehende GPS-Koordinate per
  -- nearest-centroid auf einen Orbit zu mappen — die Edge Function verwirft
  -- die Koordinate vor dem Persistieren (PRD §11.1).
  centroid_lat numeric(8,5),
  centroid_lng numeric(8,5),
  -- Bounding box als optionaler schneller Pre-Filter (south, west, north, east).
  bbox_south  numeric(8,5),
  bbox_west   numeric(8,5),
  bbox_north  numeric(8,5),
  bbox_east   numeric(8,5),
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index orbits_type_idx on public.orbits(type);
create index orbits_country_idx on public.orbits(country_code) where country_code is not null;
create index orbits_published_idx on public.orbits(published) where published;

create trigger orbits_set_updated_at
before update on public.orbits
for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.orbits enable row level security;

-- Orbits sind öffentlich lesbar (wie ein Lookup), aber nur Admins schreiben.
-- Der Admin-Check passiert erst nach 0003_users (users-Tabelle existiert dann).
create policy "orbits readable to all signed-in users"
  on public.orbits
  for select
  to authenticated
  using (published);

create policy "orbits readable to anon (gastmodus needs city names)"
  on public.orbits
  for select
  to anon
  using (published);

-- Write-Policy: kommt in 0003 nachdem users existiert. Bis dahin nur via
-- service_role (das RLS sowieso bypasst).

comment on table public.orbits is
  'PRD §6.6 / §9.1 — definiert was ein „Orbit" ist (Stadt/Land/Region). CMS-gepflegt.';

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120003_users.sql
-- ═══════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120004_contacts_friends.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0004_contacts_friends
-- public.contacts (gehashte Telefonnummern, PRD §11.2),
-- public.friend_links (kanonisierte symmetrische Mutual-Beziehung),
-- Matching-Trigger und are_friends() Helper.
-- ─────────────────────────────────────────────────────────────────────────

-- ── contacts ───────────────────────────────────────────────────────────
create table public.contacts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade, -- Owner des Adressbuchs
  -- SHA-256 + Server-Salt vom Client/Edge geliefert. Klartext nie speichern.
  phone_hash        text not null,
  display_name      text not null,                                                -- Name aus Adressbuch des Owners
  matched_user_id   uuid references public.users(id) on delete set null,
  matched_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, phone_hash)
);

create index contacts_phone_hash_idx on public.contacts(phone_hash);
create index contacts_user_idx on public.contacts(user_id);
create index contacts_matched_user_idx on public.contacts(matched_user_id) where matched_user_id is not null;

create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

-- ── friend_links (Mutuals zwischen Usern) ──────────────────────────────
-- Kanonische Form: user_a < user_b um Duplikate zu vermeiden.
create table public.friend_links (
  user_a       uuid not null references public.users(id) on delete cascade,
  user_b       uuid not null references public.users(id) on delete cascade,
  status       public.friend_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create index friend_links_user_b_idx on public.friend_links(user_b);
create index friend_links_status_idx on public.friend_links(status);

create trigger friend_links_set_updated_at
before update on public.friend_links
for each row execute function public.set_updated_at();

-- ── Trigger: contact-match → friend_link upsert ────────────────────────
-- Wird beim Einfügen oder Update eines contacts gefeuert. Wenn der Owner
-- per phone_hash auf einen User matched, prüft der Trigger ob der gegen-
-- über bereits den Owner gemerkt hat — wenn ja => mutual, sonst pending.
create or replace function public.handle_contact_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other      uuid;
  v_a          uuid;
  v_b          uuid;
  v_owner_phone text;
  v_reverse    boolean;
  v_status     public.friend_status;
begin
  -- Match: phone_hash des Kontakts zeigt auf einen public.users-Eintrag.
  if new.matched_user_id is null then
    select id into new.matched_user_id
    from public.users
    where phone_hash = new.phone_hash
      and id <> new.user_id
    limit 1;
    if new.matched_user_id is not null then
      new.matched_at := now();
    end if;
  end if;

  v_other := new.matched_user_id;
  if v_other is null then
    return new;
  end if;

  -- Schaut der gematche User uns auch im Adressbuch? Dann mutual.
  select phone_hash into v_owner_phone from public.users where id = new.user_id;
  v_reverse := false;
  if v_owner_phone is not null then
    select exists(
      select 1 from public.contacts
      where user_id = v_other
        and phone_hash = v_owner_phone
    ) into v_reverse;
  end if;

  v_status := case when v_reverse then 'mutual'::public.friend_status
                   else 'pending'::public.friend_status end;

  v_a := least(new.user_id, v_other);
  v_b := greatest(new.user_id, v_other);

  insert into public.friend_links (user_a, user_b, status)
  values (v_a, v_b, v_status)
  on conflict (user_a, user_b) do update
  set status = case
                 when public.friend_links.status = 'mutual' then 'mutual'
                 else excluded.status
               end,
      updated_at = now();

  return new;
end;
$$;

create trigger contacts_match_handle
before insert or update of phone_hash, matched_user_id on public.contacts
for each row execute function public.handle_contact_match();

-- ── are_friends helper ─────────────────────────────────────────────────
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.friend_links
    where status = 'mutual'
      and user_a = least(a, b)
      and user_b = greatest(a, b)
  );
$$;

revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- Helper: shares-location-Flag eines Users lesen, ohne user_settings-RLS
-- triggern zu müssen (Mutuals-Sicht).
create or replace function public.user_shares_location(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select share_location from public.user_settings where user_id = p_user),
    true
  );
$$;
revoke all on function public.user_shares_location(uuid) from public;
grant execute on function public.user_shares_location(uuid) to authenticated;

-- ── RLS: contacts ──────────────────────────────────────────────────────
alter table public.contacts enable row level security;

create policy "contacts: read own"
  on public.contacts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "contacts: insert own"
  on public.contacts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "contacts: update own"
  on public.contacts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "contacts: delete own"
  on public.contacts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ── RLS: friend_links ──────────────────────────────────────────────────
alter table public.friend_links enable row level security;

create policy "friend_links: read involved"
  on public.friend_links for select
  to authenticated
  using ((select auth.uid()) in (user_a, user_b));

create policy "friend_links: admin read"
  on public.friend_links for select
  to authenticated
  using (public.is_admin());

-- Inserts/Updates passieren ausschließlich über den Trigger (security definer).
-- Kein Client-Write-Path für friend_links.

-- ── Mutuals dürfen einander sehen ──────────────────────────────────────
-- users-Profil: Mutuals lesbar.
create policy "users: read mutuals"
  on public.users for select
  to authenticated
  using (public.are_friends((select auth.uid()), id));

-- user_locations: Mutuals lesbar (für Current-Orbit / Trip-Overlap-Berechnung).
-- Plus: Owner muss share_location = true haben.
create policy "user_locations: read mutuals"
  on public.user_locations for select
  to authenticated
  using (
    public.are_friends((select auth.uid()), user_id)
    and public.user_shares_location(user_id)
  );

comment on function public.handle_contact_match is
  'PRD §11.2 — Hashed phone match: setzt matched_user_id, legt friend_link an (pending oder mutual je nach Reverse-Match).';

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120005_meetups.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0005_meetups
-- public.meetups + public.meetup_participants. Gäste ohne Account werden
-- per magic_token im participants-Datensatz gespeichert (PRD §4.2 / §6.1).
-- ─────────────────────────────────────────────────────────────────────────

create table public.meetups (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references public.users(id) on delete cascade,
  title        text not null,
  date         date not null,
  -- Time/Location/Kategorie/Beschreibung sind optional (PRD §6.1).
  time         time,
  location     text,
  category     text,
  description  text,
  status       public.meetup_status not null default 'open',
  -- Optional: Anker an einen Orbit (für „nur Leute aus dem aktuellen Orbit").
  orbit_id     uuid references public.orbits(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index meetups_creator_idx on public.meetups(creator_id);
create index meetups_date_idx on public.meetups(date);
create index meetups_status_idx on public.meetups(status);
create index meetups_orbit_idx on public.meetups(orbit_id) where orbit_id is not null;

create trigger meetups_set_updated_at
before update on public.meetups
for each row execute function public.set_updated_at();

-- ── meetup_participants ────────────────────────────────────────────────
create table public.meetup_participants (
  id                 uuid primary key default gen_random_uuid(),
  meetup_id          uuid not null references public.meetups(id) on delete cascade,
  participant_id     uuid references public.users(id) on delete cascade,
  -- Gast ohne Account: Name pflegt der Inviter, Phone-Hash wird mit
  -- erfasst, damit beim späteren Account-Merge (Edge Function) der Datensatz
  -- automatisch verknüpft werden kann.
  guest_name         text,
  guest_phone_hash   text,
  -- Magic-Token für Gastmodus-Deep-Link (PRD §4.2, /m/[token]).
  -- Wird nur für Gäste gesetzt (participant_id is null).
  magic_token        text unique default encode(gen_random_bytes(16), 'hex'),
  response           public.participant_response not null default 'pending',
  response_message   text,
  responded_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Entweder echter User oder Gast — niemals beides null.
  constraint participant_or_guest
    check (
      (participant_id is not null and guest_name is null)
      or
      (participant_id is null and guest_name is not null)
    ),
  -- Gäste brauchen einen Token (für /m/[token]); User-Teilnehmer dürfen
  -- einen haben, ist aber egal.
  constraint guest_has_token
    check (participant_id is not null or magic_token is not null),
  unique (meetup_id, participant_id),                         -- ein User max. einmal pro Meetup
  unique (meetup_id, guest_phone_hash)
);

create index meetup_participants_meetup_idx on public.meetup_participants(meetup_id);
create index meetup_participants_participant_idx on public.meetup_participants(participant_id) where participant_id is not null;
create index meetup_participants_guest_phone_idx on public.meetup_participants(guest_phone_hash) where guest_phone_hash is not null;
create index meetup_participants_response_idx on public.meetup_participants(response);

create trigger meetup_participants_set_updated_at
before update on public.meetup_participants
for each row execute function public.set_updated_at();

-- responded_at automatisch setzen, wenn response von pending wegmoved.
create or replace function public.touch_responded_at()
returns trigger
language plpgsql
as $$
begin
  if new.response is distinct from old.response and new.response <> 'pending' then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger meetup_participants_touch_responded
before update of response on public.meetup_participants
for each row execute function public.touch_responded_at();

-- ── Helper: ist Viewer Teilnehmer eines Meetups? ───────────────────────
create or replace function public.is_meetup_participant(p_meetup uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.meetup_participants
    where meetup_id = p_meetup and participant_id = p_user
  );
$$;
revoke all on function public.is_meetup_participant(uuid, uuid) from public;
grant execute on function public.is_meetup_participant(uuid, uuid) to authenticated;

-- ── RLS: meetups ───────────────────────────────────────────────────────
alter table public.meetups enable row level security;

-- Lesbar für Creator und Teilnehmer (User-Teilnehmer).
create policy "meetups: read involved"
  on public.meetups for select
  to authenticated
  using (
    creator_id = (select auth.uid())
    or public.is_meetup_participant(id, (select auth.uid()))
  );

-- Lesbar für Admins.
create policy "meetups: admin read"
  on public.meetups for select
  to authenticated
  using (public.is_admin());

-- Anlegen: jeder eingeloggte User für sich selbst.
create policy "meetups: insert as creator"
  on public.meetups for insert
  to authenticated
  with check (creator_id = (select auth.uid()));

-- Updaten/Löschen: nur Creator.
create policy "meetups: update as creator"
  on public.meetups for update
  to authenticated
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

create policy "meetups: delete as creator"
  on public.meetups for delete
  to authenticated
  using (creator_id = (select auth.uid()));

-- ── RLS: meetup_participants ───────────────────────────────────────────
alter table public.meetup_participants enable row level security;

-- Lesen: Participant selbst, Creator des Meetups, sowie andere Participants
-- desselben Meetups (damit man sieht, wer noch zusagt).
create policy "meetup_participants: read involved"
  on public.meetup_participants for select
  to authenticated
  using (
    participant_id = (select auth.uid())
    or exists(
      select 1 from public.meetups m
      where m.id = meetup_id and m.creator_id = (select auth.uid())
    )
    or public.is_meetup_participant(meetup_id, (select auth.uid()))
  );

create policy "meetup_participants: admin read"
  on public.meetup_participants for select
  to authenticated
  using (public.is_admin());

-- Insert: nur der Meetup-Creator darf Teilnehmer hinzufügen.
create policy "meetup_participants: insert by creator"
  on public.meetup_participants for insert
  to authenticated
  with check (
    exists(
      select 1 from public.meetups m
      where m.id = meetup_id and m.creator_id = (select auth.uid())
    )
  );

-- Update: Participant darf seine eigene Antwort ändern; Creator darf alles.
create policy "meetup_participants: update own response"
  on public.meetup_participants for update
  to authenticated
  using (participant_id = (select auth.uid()))
  with check (participant_id = (select auth.uid()));

create policy "meetup_participants: update by creator"
  on public.meetup_participants for update
  to authenticated
  using (
    exists(
      select 1 from public.meetups m
      where m.id = meetup_id and m.creator_id = (select auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.meetups m
      where m.id = meetup_id and m.creator_id = (select auth.uid())
    )
  );

-- Delete: nur Creator (z.B. wenn jemand fälschlicherweise eingeladen wurde).
create policy "meetup_participants: delete by creator"
  on public.meetup_participants for delete
  to authenticated
  using (
    exists(
      select 1 from public.meetups m
      where m.id = meetup_id and m.creator_id = (select auth.uid())
    )
  );

-- ── Gastmodus-Lookup (PRD §4.2, /m/[token]) ────────────────────────────
-- Edge Function / API-Route lädt das Meetup über den magic_token. Per
-- security definer Funktion, damit anonyme Browser-Requests nicht mehr
-- als das eine Meetup sehen — die regulären Tabellen bleiben für anon
-- gesperrt.
create or replace function public.get_meetup_by_guest_token(p_token text)
returns table(
  meetup_id     uuid,
  title         text,
  date          date,
  "time"        time,
  location      text,
  description   text,
  category      text,
  creator_first text,
  creator_last  text,
  participant_id uuid,
  guest_name    text,
  response      public.participant_response,
  response_message text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id, m.title, m.date, m.time, m.location, m.description, m.category,
    u.first_name, u.last_name,
    mp.id, mp.guest_name, mp.response, mp.response_message
  from public.meetup_participants mp
  join public.meetups m on m.id = mp.meetup_id
  join public.users u on u.id = m.creator_id
  where mp.magic_token = p_token
$$;

revoke all on function public.get_meetup_by_guest_token(text) from public;
grant execute on function public.get_meetup_by_guest_token(text) to anon, authenticated;

-- Antwort durch Gast schreiben.
create or replace function public.respond_as_guest(
  p_token text,
  p_response public.participant_response,
  p_message text default null,
  p_guest_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.meetup_participants
  set response = p_response,
      response_message = p_message,
      guest_name = coalesce(p_guest_name, guest_name),
      responded_at = now()
  where magic_token = p_token;
  if not found then
    raise exception 'invalid token';
  end if;
end;
$$;

revoke all on function public.respond_as_guest(text, public.participant_response, text, text) from public;
grant execute on function public.respond_as_guest(text, public.participant_response, text, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120006_trips.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0006_trips
-- public.trips + public.trip_participants. Anschlussreisen via parent_trip_id.
-- PRD §6.5 / §9.1.
-- ─────────────────────────────────────────────────────────────────────────

create table public.trips (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  orbit_id        uuid not null references public.orbits(id) on delete restrict,
  start_date      date not null,
  end_date        date not null,
  reason          text,                                    -- frei (Business / Auslandssemester / Familienurlaub)
  parent_trip_id  uuid references public.trips(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date >= start_date)
);

create index trips_user_idx on public.trips(user_id);
create index trips_orbit_idx on public.trips(orbit_id);
create index trips_dates_idx on public.trips(start_date, end_date);
create index trips_parent_idx on public.trips(parent_trip_id) where parent_trip_id is not null;

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

-- ── trip_participants (Co-Reisende) ────────────────────────────────────
create table public.trip_participants (
  trip_id     uuid not null references public.trips(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index trip_participants_user_idx on public.trip_participants(user_id);

-- ── RLS: trips ─────────────────────────────────────────────────────────
alter table public.trips enable row level security;

-- Eigene Trips immer.
create policy "trips: read own"
  on public.trips for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Mutuals dürfen Trips ihrer Mutuals lesen (Trip-Overlap-Notification).
-- Plus: share_location muss true sein.
create policy "trips: read mutuals"
  on public.trips for select
  to authenticated
  using (
    public.are_friends((select auth.uid()), user_id)
    and public.user_shares_location(user_id)
  );

-- Co-Reisende dürfen den Trip lesen (z.B. wenn wir hinzugefügt sind).
create policy "trips: read as co-traveler"
  on public.trips for select
  to authenticated
  using (
    exists(
      select 1 from public.trip_participants tp
      where tp.trip_id = id and tp.user_id = (select auth.uid())
    )
  );

create policy "trips: admin read"
  on public.trips for select
  to authenticated
  using (public.is_admin());

create policy "trips: insert own"
  on public.trips for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "trips: update own"
  on public.trips for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "trips: delete own"
  on public.trips for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ── RLS: trip_participants ─────────────────────────────────────────────
alter table public.trip_participants enable row level security;

-- Lesen: alle, die den Trip sehen dürfen (Owner, Co-Traveler, Mutuals).
create policy "trip_participants: read if trip visible"
  on public.trip_participants for select
  to authenticated
  using (
    exists(
      select 1 from public.trips t
      where t.id = trip_id
        and (
          t.user_id = (select auth.uid())
          or public.are_friends((select auth.uid()), t.user_id)
          or exists(
            select 1 from public.trip_participants tp
            where tp.trip_id = t.id and tp.user_id = (select auth.uid())
          )
        )
    )
  );

-- Insert/Delete: nur der Trip-Owner.
create policy "trip_participants: write by owner"
  on public.trip_participants for all
  to authenticated
  using (
    exists(
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  )
  with check (
    exists(
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120007_notifications.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0007_notifications
-- public.notifications — Notification-Inbox pro User. Jeder Eintrag eine
-- Anzeigezeile in /notifications. Fan-out aus anderen Triggern oder Edge
-- Functions (Push-Trigger).
-- PRD §6.2 / §9.1.
-- ─────────────────────────────────────────────────────────────────────────

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        public.notification_type not null,
  -- payload enthält typabhängige Daten (Foreign Keys, Snippets etc.).
  -- Konvention: { meetup_id, actor_id, trip_id, orbit_id, ... }
  payload     jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;
create index notifications_type_idx on public.notifications(type);

-- ── Convenience: mark all read ─────────────────────────────────────────
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_ids is null then
    update public.notifications
    set read_at = now()
    where user_id = (select auth.uid()) and read_at is null;
  else
    update public.notifications
    set read_at = now()
    where user_id = (select auth.uid()) and id = any(p_ids) and read_at is null;
  end if;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_notifications_read(uuid[]) from public;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.notifications enable row level security;

create policy "notifications: read own"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Notifications werden vom System geschrieben (Trigger/Edge-Functions mit
-- service_role). Kein direkter Client-Insert.

-- Markieren als gelesen → eigenes Update erlaubt, aber nur read_at.
create policy "notifications: update own"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications: delete own"
  on public.notifications for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: admin read"
  on public.notifications for select
  to authenticated
  using (public.is_admin());

-- ── Auto-Notification: neue Meetup-Einladung (PRD §6.2 invite) ─────────
create or replace function public.notify_meetup_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
begin
  if new.participant_id is null then
    return new;
  end if;
  select creator_id into v_creator from public.meetups where id = new.meetup_id;
  if v_creator is null or v_creator = new.participant_id then
    return new;
  end if;
  insert into public.notifications (user_id, type, payload)
  values (
    new.participant_id,
    'invite',
    jsonb_build_object(
      'meetup_id', new.meetup_id,
      'participant_row_id', new.id,
      'actor_id', v_creator
    )
  );
  return new;
end;
$$;

create trigger meetup_participants_notify_invite
after insert on public.meetup_participants
for each row execute function public.notify_meetup_invite();

-- ── Auto-Notification: reschedule (PRD §6.2 reschedule) ────────────────
create or replace function public.notify_meetup_reschedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
begin
  if new.response = 'reschedule' and (old.response is distinct from new.response) then
    select creator_id into v_creator from public.meetups where id = new.meetup_id;
    if v_creator is not null then
      insert into public.notifications (user_id, type, payload)
      values (
        v_creator,
        'reschedule',
        jsonb_build_object(
          'meetup_id', new.meetup_id,
          'actor_id', new.participant_id,
          'message', new.response_message
        )
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger meetup_participants_notify_reschedule
after update of response on public.meetup_participants
for each row execute function public.notify_meetup_reschedule();

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120008_invites.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0008_invites
-- public.invites — persönliche Deep-Links (PRD §6.7) und gezielte
-- Invite-Links (mit target_phone_hash für vorgematche Empfänger).
-- ─────────────────────────────────────────────────────────────────────────

create table public.invites (
  id                    uuid primary key default gen_random_uuid(),
  inviter_id            uuid not null references public.users(id) on delete cascade,
  -- Random Token, der als Deep-Link kommt (z.B. orbit.app/i/abc123).
  link_token            text not null unique default encode(gen_random_bytes(12), 'hex'),
  -- Optional: vor-targetiert auf eine Telefonnummer (gehasht) — dann bekommt
  -- der Inviter sofort eine Notification beim Account-Create.
  target_phone_hash     text,
  accepted_by_user_id   uuid references public.users(id) on delete set null,
  accepted_at           timestamptz,
  created_at            timestamptz not null default now(),
  expires_at            timestamptz                                              -- optional, NULL = unbegrenzt
);

create index invites_inviter_idx on public.invites(inviter_id);
create index invites_token_idx on public.invites(link_token);
create index invites_target_phone_idx on public.invites(target_phone_hash) where target_phone_hash is not null;
create index invites_accepted_idx on public.invites(accepted_by_user_id) where accepted_by_user_id is not null;

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.invites enable row level security;

-- Lesen: Inviter sieht seine eigenen Invites (z.B. um Conversion zu zeigen).
create policy "invites: read own"
  on public.invites for select
  to authenticated
  using (inviter_id = (select auth.uid()));

create policy "invites: admin read"
  on public.invites for select
  to authenticated
  using (public.is_admin());

create policy "invites: insert own"
  on public.invites for insert
  to authenticated
  with check (inviter_id = (select auth.uid()));

create policy "invites: delete own"
  on public.invites for delete
  to authenticated
  using (inviter_id = (select auth.uid()));

-- ── Public lookup (Browser hat noch keinen Account) ────────────────────
-- Gibt nur die Mindest-Daten zurück, damit die Landing-Page bauen kann
-- („Henrik hat dich eingeladen") — kein Listing aller Invites.
create or replace function public.get_invite_meta(p_token text)
returns table(
  inviter_first text,
  inviter_last  text,
  inviter_avatar text,
  expired       boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.first_name, u.last_name, u.avatar_url,
    (i.expires_at is not null and i.expires_at < now())
  from public.invites i
  join public.users u on u.id = i.inviter_id
  where i.link_token = p_token
$$;

revoke all on function public.get_invite_meta(text) from public;
grant execute on function public.get_invite_meta(text) to anon, authenticated;

-- Beim Sign-Up: Token einlösen, accepted_by setzen, Inviter-Notification
-- (PRD §6.7 „Lisa ist jetzt auf Orbit. Sie ist gerade in Münster.").
create or replace function public.redeem_invite(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
begin
  select * into v_invite from public.invites where link_token = p_token;
  if not found then
    raise exception 'invalid invite token';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite expired';
  end if;
  if v_invite.accepted_by_user_id is not null then
    return;
  end if;

  update public.invites
  set accepted_by_user_id = (select auth.uid()),
      accepted_at = now()
  where id = v_invite.id;

  insert into public.notifications (user_id, type, payload)
  values (
    v_invite.inviter_id,
    'new_signup',
    jsonb_build_object(
      'actor_id', (select auth.uid()),
      'invite_id', v_invite.id
    )
  );
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120009_cms_events.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0009_cms_events
-- public.cms_content + public.cms_assets — In-App-Strings/Assets, vom
-- Admin-CMS gepflegt (PRD §10.2). public.events als minimaler Event-Log
-- für Onboarding-Funnel + Engagement-KPIs (PRD §12).
-- ─────────────────────────────────────────────────────────────────────────

-- ── cms_content ────────────────────────────────────────────────────────
create table public.cms_content (
  id            uuid primary key default gen_random_uuid(),
  -- Stabile Schlüssel z.B. 'onboarding.screen2.subtitle', 'empty.notifications.title'
  key           text not null,
  locale        text not null default 'de',                 -- de | en
  body          jsonb not null,                              -- Markdown oder strukturierte Inhalte
  published     boolean not null default false,
  published_at  timestamptz,
  updated_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (key, locale)
);

create index cms_content_key_idx on public.cms_content(key);
create index cms_content_locale_idx on public.cms_content(locale);
create index cms_content_published_idx on public.cms_content(published) where published;

create trigger cms_content_set_updated_at
before update on public.cms_content
for each row execute function public.set_updated_at();

-- ── cms_assets ─────────────────────────────────────────────────────────
create table public.cms_assets (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  storage_path  text not null,                               -- bucket-relativer Pfad in 'cms-assets'
  meta          jsonb not null default '{}'::jsonb,          -- { width, height, mime, alt, ... }
  updated_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger cms_assets_set_updated_at
before update on public.cms_assets
for each row execute function public.set_updated_at();

-- ── RLS: cms_content ───────────────────────────────────────────────────
alter table public.cms_content enable row level security;

create policy "cms_content: read published (anon + auth)"
  on public.cms_content for select
  to anon, authenticated
  using (published);

create policy "cms_content: admin read all"
  on public.cms_content for select
  to authenticated
  using (public.is_admin());

create policy "cms_content: admin write"
  on public.cms_content for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── RLS: cms_assets ────────────────────────────────────────────────────
alter table public.cms_assets enable row level security;

create policy "cms_assets: read all"
  on public.cms_assets for select
  to anon, authenticated
  using (true);

create policy "cms_assets: admin write"
  on public.cms_assets for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── events (Analytics-Log, PRD §12.2) ──────────────────────────────────
create table public.events (
  id          bigserial primary key,
  user_id     uuid references public.users(id) on delete set null,
  -- Event-Name z.B. 'onboarding_screen_view', 'meetup_sent', 'invite_sent',
  -- 'first_meetup', 'login'.
  name        text not null,
  props       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index events_user_idx on public.events(user_id, created_at desc);
create index events_name_idx on public.events(name, created_at desc);
create index events_created_idx on public.events(created_at desc);

alter table public.events enable row level security;

-- User darf eigene Events schreiben.
create policy "events: insert own"
  on public.events for insert
  to authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- Anon-Tracker (z.B. Gastmodus-Funnel) erlaubt — user_id muss null sein.
create policy "events: insert anon"
  on public.events for insert
  to anon
  with check (user_id is null);

-- Lesen nur Admins (Funnel-Dashboard).
create policy "events: admin read"
  on public.events for select
  to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120010_storage.sql
-- ═══════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════
-- 20260428120011_realtime.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0011_realtime
-- Tabellen, die per Supabase Realtime gepusht werden.
-- PRD §9.3:
--   meetups:user_id=<me>, current_orbit:orbit_id=<x>, notifications:user_id=<me>
-- ─────────────────────────────────────────────────────────────────────────

-- Replica Identity FULL für Realtime-Updates (sonst sind alte Werte nicht sichtbar).
alter table public.meetups replica identity full;
alter table public.meetup_participants replica identity full;
alter table public.notifications replica identity full;
alter table public.user_locations replica identity full;
alter table public.friend_links replica identity full;
alter table public.trips replica identity full;

-- supabase_realtime publication ist standardmäßig in Supabase-Projekten vorhanden.
-- Falls nicht, entkommentieren:
-- create publication if not exists supabase_realtime;

do $$
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.meetups';
    execute 'alter publication supabase_realtime add table public.meetup_participants';
    execute 'alter publication supabase_realtime add table public.notifications';
    execute 'alter publication supabase_realtime add table public.user_locations';
    execute 'alter publication supabase_realtime add table public.friend_links';
    execute 'alter publication supabase_realtime add table public.trips';
  end if;
exception
  when duplicate_object then null;        -- Tabelle bereits Teil der Publication
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- seed.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- seed.sql
-- Initiale Stammdaten für orbits + CMS-Strings. Wird nach den Migrations
-- ausgeführt. Idempotent (on conflict do nothing).
-- ─────────────────────────────────────────────────────────────────────────

-- ── Orbits — Deutschland (Cities) ──────────────────────────────────────
insert into public.orbits (slug, name, type, country_code, centroid_lat, centroid_lng) values
  ('muenster',    'Münster',    'city', 'DE', 51.96027, 7.62571),
  ('berlin',      'Berlin',     'city', 'DE', 52.52000, 13.40500),
  ('hamburg',     'Hamburg',    'city', 'DE', 53.55108, 9.99368),
  ('muenchen',    'München',    'city', 'DE', 48.13743, 11.57549),
  ('koeln',       'Köln',       'city', 'DE', 50.93753, 6.96028),
  ('frankfurt',   'Frankfurt',  'city', 'DE', 50.11092, 8.68213),
  ('stuttgart',   'Stuttgart',  'city', 'DE', 48.77584, 9.18293),
  ('duesseldorf', 'Düsseldorf', 'city', 'DE', 51.22774, 6.77346),
  ('dresden',     'Dresden',    'city', 'DE', 51.05040, 13.73720),
  ('leipzig',     'Leipzig',    'city', 'DE', 51.33970, 12.37130),
  ('bonn',        'Bonn',       'city', 'DE', 50.73743, 7.09821),
  ('aachen',      'Aachen',     'city', 'DE', 50.77535, 6.08387),
  ('osnabrueck',  'Osnabrück',  'city', 'DE', 52.27993, 8.04719),
  ('bremen',      'Bremen',     'city', 'DE', 53.07930, 8.80169),
  ('hannover',    'Hannover',   'city', 'DE', 52.37522, 9.73201)
on conflict (slug) do nothing;

-- ── Orbits — Auslands-Länder/Regionen (PRD §6.6) ───────────────────────
insert into public.orbits (slug, name, type, country_code, centroid_lat, centroid_lng) values
  ('mallorca',    'Mallorca',   'region', 'ES', 39.69527, 3.01764),
  ('thailand',    'Thailand',   'country', 'TH', 15.87003, 100.99254),
  ('spanien',     'Spanien',    'country', 'ES', 40.46367, -3.74922),
  ('portugal',    'Portugal',   'country', 'PT', 39.39972, -8.22454),
  ('frankreich',  'Frankreich', 'country', 'FR', 46.22764, 2.21375),
  ('italien',     'Italien',    'country', 'IT', 41.87194, 12.56738),
  ('niederlande', 'Niederlande','country', 'NL', 52.13262, 5.29127),
  ('uk',          'England',    'country', 'GB', 52.35551, -1.17432),
  ('usa',         'USA',        'country', 'US', 37.09024, -95.71289),
  ('lissabon',    'Lissabon',   'city',    'PT', 38.71668, -9.13959),
  ('paris',       'Paris',      'city',    'FR', 48.85661, 2.35222),
  ('barcelona',   'Barcelona',  'city',    'ES', 41.38506, 2.17340),
  ('amsterdam',   'Amsterdam',  'city',    'NL', 52.36766, 4.90405),
  ('london',      'London',     'city',    'GB', 51.50735, -0.12776),
  ('new-york',    'New York',   'city',    'US', 40.71278, -74.00594)
on conflict (slug) do nothing;

-- ── CMS — Onboarding-Strings (PRD §5) ──────────────────────────────────
insert into public.cms_content (key, locale, body, published, published_at) values
  ('onboarding.screen0.title',    'de',
    jsonb_build_object('text','orbit'),
    true, now()),
  ('onboarding.screen0.subtitle', 'de',
    jsonb_build_object('text','your social life'),
    true, now()),
  ('onboarding.screen1.subtitle', 'de',
    jsonb_build_object('text','Finde heraus, wer von deinen Leuten gerade in deiner Stadt ist.'),
    true, now()),
  ('onboarding.screen2.title',    'de',
    jsonb_build_object('text','Standort freigeben'),
    true, now()),
  ('onboarding.screen2.subtitle', 'de',
    jsonb_build_object('text','Orbit erkennt, in welcher Stadt du bist. Nie wo genau.'),
    true, now()),
  ('onboarding.screen2.subtext',  'de',
    jsonb_build_object('text','Wir speichern keine GPS-Daten, nur den Städtenamen.'),
    true, now()),
  ('onboarding.screen3.title',    'de',
    jsonb_build_object('text','Kontakte synchronisieren'),
    true, now()),
  ('onboarding.screen3.empty',    'de',
    jsonb_build_object('text','Du bist einer der Ersten! Lade 3 Freunde ein und Orbit wird lebendig.'),
    true, now())
on conflict (key, locale) do nothing;

-- ── CMS — Empty-State-Strings (DESIGN1.md §9 + PRD §6) ────────────────
insert into public.cms_content (key, locale, body, published, published_at) values
  ('empty.notifications.title', 'de',
    jsonb_build_object('text','Noch nichts im Briefkasten.'),
    true, now()),
  ('empty.notifications.body', 'de',
    jsonb_build_object('text','Wenn jemand dich anpingt, landet''s hier.'),
    true, now()),
  ('empty.current_orbit.title', 'de',
    jsonb_build_object('text','Niemand im Orbit.'),
    true, now()),
  ('empty.current_orbit.body', 'de',
    jsonb_build_object('text','Sobald Freunde in deiner Stadt sind, tauchen sie hier auf.'),
    true, now()),
  ('empty.calendar.title', 'de',
    jsonb_build_object('text','Kein Termin im Kalender.'),
    true, now()),
  ('empty.calendar.body', 'de',
    jsonb_build_object('text','Plane einen Meetup oder warte auf Anfragen.'),
    true, now()),
  ('empty.trips.title', 'de',
    jsonb_build_object('text','Keine Reisen geplant.'),
    true, now()),
  ('empty.trips.body', 'de',
    jsonb_build_object('text','Trag deinen nächsten Trip ein, damit andere wissen, wo du bist.'),
    true, now()),
  ('empty.personal.title', 'de',
    jsonb_build_object('text','Dein Album ist leer.'),
    true, now()),
  ('empty.personal.body', 'de',
    jsonb_build_object('text','Hier landen Erinnerungen aus euren Treffen.'),
    true, now())
on conflict (key, locale) do nothing;

-- ── CMS — Notification-Templates (PRD §6.2) ────────────────────────────
insert into public.cms_content (key, locale, body, published, published_at) values
  ('notification.invite.title', 'de',
    jsonb_build_object('template','{{actor}} will dich treffen'),
    true, now()),
  ('notification.invite.body', 'de',
    jsonb_build_object('template','„{{title}} — {{date}}{{#time}}, {{time}}{{/time}}"'),
    true, now()),
  ('notification.reschedule.title', 'de',
    jsonb_build_object('template','{{actor}} schlägt einen neuen Termin vor'),
    true, now()),
  ('notification.new_signup.title', 'de',
    jsonb_build_object('template','{{actor}} ist jetzt auf Orbit'),
    true, now()),
  ('notification.new_signup.body', 'de',
    jsonb_build_object('template','{{#orbit}}Sie ist gerade in {{orbit}}.{{/orbit}}'),
    true, now()),
  ('notification.trip_overlap.title', 'de',
    jsonb_build_object('template','{{actor}} reist zur gleichen Zeit nach {{orbit}}'),
    true, now()),
  ('notification.new_in_orbit.title', 'de',
    jsonb_build_object('template','{{actor}} ist jetzt in {{orbit}}'),
    true, now())
on conflict (key, locale) do nothing;
