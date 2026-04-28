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
