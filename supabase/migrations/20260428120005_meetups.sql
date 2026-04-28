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
