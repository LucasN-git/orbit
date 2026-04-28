-- ─────────────────────────────────────────────────────────────────────────
-- dev_seed.sql — 5 Test-User (Lucas, Henrik, Robin, Mira, Tobi)
-- Räumt vorhandene @orbit.dev-Test-User komplett ab und legt frischen Stand an.
-- Im Supabase SQL Editor ausführen — am Ende kommt ein NOTICE mit der
-- DEV_USER_ID, die du in .env.local einträgst.
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1) Reset (cascades nach public.users + alles dran) ─────────────────
delete from auth.users where email like '%@orbit.dev';

-- ── 2) Helper: User in auth.users anlegen, public-Trigger spiegelt nach
--             public.users + user_settings. Phone-Hash kommt nach.
create or replace function public.dev_create_user(
  p_email      text,
  p_first      text,
  p_last       text,
  p_username   text,
  p_phone_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_id  uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_anonymous,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('dev-only-not-for-login', extensions.gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
    jsonb_build_object('first_name', p_first, 'last_name', p_last),
    false, '', '', '', ''
  );
  update public.users
    set phone_hash = p_phone_hash, username = p_username
    where id = v_id;
  return v_id;
end;
$$;

-- ── 3) Hauptblock: User + alles dran ───────────────────────────────────
do $$
declare
  v_lucas   uuid;
  v_henrik  uuid;
  v_robin   uuid;
  v_mira    uuid;
  v_tobi    uuid;
  v_muenster uuid;
  v_berlin   uuid;
  v_mallorca uuid;
  v_lissabon uuid;
  v_m1 uuid := gen_random_uuid();
  v_m2 uuid := gen_random_uuid();
  v_m3 uuid := gen_random_uuid();
  v_m4 uuid := gen_random_uuid();
  v_t1 uuid := gen_random_uuid();
  v_t2 uuid := gen_random_uuid();
begin
  -- 5 User anlegen
  v_lucas  := public.dev_create_user('lucas@orbit.dev',  'Lucas',  'Nasch',   'lucas',  'hash_lucas');
  v_henrik := public.dev_create_user('henrik@orbit.dev', 'Henrik', 'Söder',   'henrik', 'hash_henrik');
  v_robin  := public.dev_create_user('robin@orbit.dev',  'Robin',  'Berger',  'robin',  'hash_robin');
  v_mira   := public.dev_create_user('mira@orbit.dev',   'Mira',   'Falk',    'mira',   'hash_mira');
  v_tobi   := public.dev_create_user('tobi@orbit.dev',   'Tobi',   'Lange',   'tobi',   'hash_tobi');

  -- Orbit-IDs aus seed.sql
  select id into v_muenster from public.orbits where slug = 'muenster';
  select id into v_berlin   from public.orbits where slug = 'berlin';
  select id into v_mallorca from public.orbits where slug = 'mallorca';
  select id into v_lissabon from public.orbits where slug = 'lissabon';

  -- ── Friend-Links (alle mutual; kanonisch user_a < user_b) ────────────
  insert into public.friend_links (user_a, user_b, status) values
    -- Lucas mit allen
    (least(v_lucas, v_henrik),  greatest(v_lucas, v_henrik),  'mutual'),
    (least(v_lucas, v_robin),   greatest(v_lucas, v_robin),   'mutual'),
    (least(v_lucas, v_mira),    greatest(v_lucas, v_mira),    'mutual'),
    (least(v_lucas, v_tobi),    greatest(v_lucas, v_tobi),    'mutual'),
    -- Cross-Friendships für Mutuals-Berechnung
    (least(v_henrik, v_mira),   greatest(v_henrik, v_mira),   'mutual'),
    (least(v_henrik, v_tobi),   greatest(v_henrik, v_tobi),   'mutual'),
    (least(v_henrik, v_robin),  greatest(v_henrik, v_robin),  'mutual'),
    (least(v_mira, v_tobi),     greatest(v_mira, v_tobi),     'mutual')
  on conflict (user_a, user_b) do update set status = 'mutual';

  -- ── Standorte ────────────────────────────────────────────────────────
  insert into public.user_locations (user_id, orbit_id, last_seen_at) values
    (v_lucas,  v_muenster, now() - interval '14 days'),
    (v_henrik, v_muenster, now() - interval '38 days'),
    (v_mira,   v_muenster, now() -  interval '8 days'),
    (v_tobi,   v_muenster, now() - interval '22 days'),
    (v_robin,  v_berlin,   now() -  interval '4 days')
  on conflict (user_id) do update
    set orbit_id = excluded.orbit_id, last_seen_at = excluded.last_seen_at;

  -- ── Meetups ──────────────────────────────────────────────────────────
  insert into public.meetups (id, creator_id, title, date, time, location, category, description, status, orbit_id) values
    (v_m1, v_lucas,
      'Sonntags-Brunch im Marta',
      current_date + 5,  '11:00',
      'Café Marta, Wolbecker Straße 23',
      'Café',
      'Lange nicht mehr gesehen — bringt Hunger mit.',
      'open', v_muenster),
    (v_m2, v_lucas,
      'Aasee-Lauf',
      current_date + 7,  '07:30',
      'Aasee Nordufer',
      'Sport',
      '8km gemütlich, danach Kaffee.',
      'open', v_muenster),
    (v_m3, v_mira,
      'Geburtstag Mira 🎂',
      current_date + 12, '20:00',
      'Heaven, Hafenweg 26',
      'Party',
      'Würde mich freuen, wenn ihr alle kommt!',
      'accepted', v_muenster),
    (v_m4, v_henrik,
      'Pizza-Abend bei Lugar Comum',
      current_date + 3, '19:00',
      'Lugar Comum',
      'Restaurant',
      null,
      'open', v_muenster);

  -- Teilnehmer
  -- M1: Brunch — Henrik (accepted), Mira (pending), Tobi (reschedule)
  insert into public.meetup_participants (meetup_id, participant_id, response) values
    (v_m1, v_henrik, 'accepted'),
    (v_m1, v_mira,   'pending'),
    (v_m1, v_tobi,   'reschedule');
  -- M2: Aasee-Lauf — Tobi (accepted), Henrik (declined)
  insert into public.meetup_participants (meetup_id, participant_id, response) values
    (v_m2, v_tobi,  'accepted'),
    (v_m2, v_henrik, 'declined');
  -- M3: Mira's Geburtstag — Lucas, Henrik, Tobi (accepted), Robin (pending)
  insert into public.meetup_participants (meetup_id, participant_id, response) values
    (v_m3, v_lucas,  'accepted'),
    (v_m3, v_henrik, 'accepted'),
    (v_m3, v_tobi,   'accepted'),
    (v_m3, v_robin,  'pending');
  -- M4: Henrik's Pizza-Abend — Lucas eingeladen, response pending
  --     → notify_meetup_invite-Trigger legt automatisch eine 'invite'-Notification an.
  insert into public.meetup_participants (meetup_id, participant_id, response) values
    (v_m4, v_lucas, 'pending'),
    (v_m4, v_mira,  'pending'),
    (v_m4, v_tobi,  'accepted');

  -- ── Trips (mit Overlaps) ─────────────────────────────────────────────
  insert into public.trips (id, user_id, orbit_id, start_date, end_date, reason) values
    -- Lucas: Mallorca (overlap mit Henrik)
    (v_t1, v_lucas, v_mallorca, current_date + 30, current_date + 37, 'Familienurlaub'),
    -- Lucas: Berlin (overlap mit Mira)
    (v_t2, v_lucas, v_berlin,   current_date + 18, current_date + 21, 'Hochzeit Anna');

  -- Andere Trips (Overlaps + ein Stand-Alone)
  insert into public.trips (user_id, orbit_id, start_date, end_date, reason) values
    (v_henrik, v_mallorca, current_date + 31, current_date + 36, 'Urlaub mit Lisa'),
    (v_mira,   v_berlin,   current_date + 19, current_date + 20, 'Konferenz'),
    (v_robin,  v_lissabon, current_date + 5,  current_date + 75, 'Auslandssemester'),
    (v_tobi,   v_mallorca, current_date + 60, current_date + 70, 'Wandern');

  -- ── Kontakte (für „X von Y auf Orbit") ──────────────────────────────
  -- 4 matched (Henrik/Robin/Mira/Tobi via phone_hash) + 8 unmatched
  insert into public.contacts (user_id, phone_hash, display_name) values
    (v_lucas, 'hash_henrik',           'Henrik Söder'),
    (v_lucas, 'hash_robin',            'Robin Berger'),
    (v_lucas, 'hash_mira',             'Mira Falk'),
    (v_lucas, 'hash_tobi',             'Tobi Lange'),
    (v_lucas, 'hash_unmatch_paula',    'Paula Sommer'),
    (v_lucas, 'hash_unmatch_jens',     'Jens Brand'),
    (v_lucas, 'hash_unmatch_clara',    'Clara Vogel'),
    (v_lucas, 'hash_unmatch_ben',      'Ben Ostermann'),
    (v_lucas, 'hash_unmatch_noah',     'Noah Greve'),
    (v_lucas, 'hash_unmatch_anna',     'Anna Petersen'),
    (v_lucas, 'hash_unmatch_jan',      'Jan Müller'),
    (v_lucas, 'hash_unmatch_lea',      'Lea Stein');
  -- handle_contact_match-Trigger setzt matched_user_id für die ersten 4
  -- automatisch (phone_hash matcht public.users.phone_hash).

  -- ── Notifications (zusätzlich zu den auto-getriggerten) ──────────────
  insert into public.notifications (user_id, type, payload, created_at) values
    (v_lucas, 'trip_overlap',
      jsonb_build_object('actor_id', v_henrik, 'orbit', 'Mallorca', 'trip_id', v_t1),
      now() - interval '2 hours'),
    (v_lucas, 'trip_overlap',
      jsonb_build_object('actor_id', v_mira, 'orbit', 'Berlin', 'trip_id', v_t2),
      now() - interval '6 hours'),
    (v_lucas, 'new_signup',
      jsonb_build_object('actor_id', v_robin),
      now() - interval '1 day'),
    (v_lucas, 'new_in_orbit',
      jsonb_build_object('actor_id', v_mira, 'orbit', 'Münster'),
      now() - interval '8 days');

  raise notice '════════════════════════════════════════════════════════════';
  raise notice 'DEV_USER_ID = %', v_lucas;
  raise notice 'Setze in .env.local:  DEV_USER_ID=%', v_lucas;
  raise notice '════════════════════════════════════════════════════════════';
end;
$$;

-- ── 4) Helper wieder aufräumen ─────────────────────────────────────────
drop function if exists public.dev_create_user(text, text, text, text, text);
