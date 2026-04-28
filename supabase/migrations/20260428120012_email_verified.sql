-- ─────────────────────────────────────────────────────────────────────────
-- 0012_email_verified
-- public.users.email_verified_at — nullable, gesetzt nach Email-Verify
-- (Magic-Link-Klick, OAuth-Callback). Bei Passwort-Sign-up bleibt das Feld
-- null, bis der User über den Resend-Button im Personal-Tab bestätigt.
--
-- "Confirm email" in Supabase ist (per Dashboard) AUS — der User wird also
-- direkt nach dem signUp eingeloggt. Email-Verifizierung ist ein separater,
-- nicht blockierender App-Flow.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.users
  add column if not exists email_verified_at timestamptz;

-- Bestehende User optimistisch als verifiziert behandeln — die haben sich
-- bereits mindestens einmal angemeldet.
update public.users
   set email_verified_at = now()
 where email_verified_at is null;

-- Trigger erweitern: OAuth-Provider (Apple/Google) liefern eine vom IdP
-- verifizierte Email mit, also direkt setzen. Email-Provider bleibt null
-- bis zum erfolgreichen Verify-Callback.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider public.auth_provider;
  v_verified timestamptz;
begin
  v_provider := case
    when new.raw_app_meta_data->>'provider' = 'apple'  then 'apple'::public.auth_provider
    when new.raw_app_meta_data->>'provider' = 'google' then 'google'::public.auth_provider
    when new.is_anonymous = true                       then 'anonymous'::public.auth_provider
    else 'email'::public.auth_provider
  end;

  v_verified := case v_provider
    when 'apple'  then now()
    when 'google' then now()
    else null
  end;

  insert into public.users (id, email, first_name, last_name, auth_provider, avatar_url, email_verified_at)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'given_name',
      split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'family_name',
      nullif(
        substring(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '') from position(' ' in coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))+1),
        ''
      )
    ),
    v_provider,
    new.raw_user_meta_data->>'avatar_url',
    v_verified
  );

  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$;
