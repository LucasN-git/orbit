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
