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
