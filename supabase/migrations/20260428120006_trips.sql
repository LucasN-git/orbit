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
