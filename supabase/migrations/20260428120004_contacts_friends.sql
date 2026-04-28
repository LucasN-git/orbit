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
