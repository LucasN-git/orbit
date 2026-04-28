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
