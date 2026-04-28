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
