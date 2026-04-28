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
