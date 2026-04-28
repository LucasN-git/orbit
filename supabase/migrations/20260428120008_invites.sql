-- ─────────────────────────────────────────────────────────────────────────
-- 0008_invites
-- public.invites — persönliche Deep-Links (PRD §6.7) und gezielte
-- Invite-Links (mit target_phone_hash für vorgematche Empfänger).
-- ─────────────────────────────────────────────────────────────────────────

create table public.invites (
  id                    uuid primary key default gen_random_uuid(),
  inviter_id            uuid not null references public.users(id) on delete cascade,
  -- Random Token, der als Deep-Link kommt (z.B. orbit.app/i/abc123).
  link_token            text not null unique default encode(gen_random_bytes(12), 'hex'),
  -- Optional: vor-targetiert auf eine Telefonnummer (gehasht) — dann bekommt
  -- der Inviter sofort eine Notification beim Account-Create.
  target_phone_hash     text,
  accepted_by_user_id   uuid references public.users(id) on delete set null,
  accepted_at           timestamptz,
  created_at            timestamptz not null default now(),
  expires_at            timestamptz                                              -- optional, NULL = unbegrenzt
);

create index invites_inviter_idx on public.invites(inviter_id);
create index invites_token_idx on public.invites(link_token);
create index invites_target_phone_idx on public.invites(target_phone_hash) where target_phone_hash is not null;
create index invites_accepted_idx on public.invites(accepted_by_user_id) where accepted_by_user_id is not null;

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.invites enable row level security;

-- Lesen: Inviter sieht seine eigenen Invites (z.B. um Conversion zu zeigen).
create policy "invites: read own"
  on public.invites for select
  to authenticated
  using (inviter_id = (select auth.uid()));

create policy "invites: admin read"
  on public.invites for select
  to authenticated
  using (public.is_admin());

create policy "invites: insert own"
  on public.invites for insert
  to authenticated
  with check (inviter_id = (select auth.uid()));

create policy "invites: delete own"
  on public.invites for delete
  to authenticated
  using (inviter_id = (select auth.uid()));

-- ── Public lookup (Browser hat noch keinen Account) ────────────────────
-- Gibt nur die Mindest-Daten zurück, damit die Landing-Page bauen kann
-- („Henrik hat dich eingeladen") — kein Listing aller Invites.
create or replace function public.get_invite_meta(p_token text)
returns table(
  inviter_first text,
  inviter_last  text,
  inviter_avatar text,
  expired       boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.first_name, u.last_name, u.avatar_url,
    (i.expires_at is not null and i.expires_at < now())
  from public.invites i
  join public.users u on u.id = i.inviter_id
  where i.link_token = p_token
$$;

revoke all on function public.get_invite_meta(text) from public;
grant execute on function public.get_invite_meta(text) to anon, authenticated;

-- Beim Sign-Up: Token einlösen, accepted_by setzen, Inviter-Notification
-- (PRD §6.7 „Lisa ist jetzt auf Orbit. Sie ist gerade in Münster.").
create or replace function public.redeem_invite(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
begin
  select * into v_invite from public.invites where link_token = p_token;
  if not found then
    raise exception 'invalid invite token';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite expired';
  end if;
  if v_invite.accepted_by_user_id is not null then
    return;
  end if;

  update public.invites
  set accepted_by_user_id = (select auth.uid()),
      accepted_at = now()
  where id = v_invite.id;

  insert into public.notifications (user_id, type, payload)
  values (
    v_invite.inviter_id,
    'new_signup',
    jsonb_build_object(
      'actor_id', (select auth.uid()),
      'invite_id', v_invite.id
    )
  );
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;
