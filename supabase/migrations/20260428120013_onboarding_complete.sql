-- ─────────────────────────────────────────────────────────────────────────
-- 0013_onboarding_complete
-- public.users.onboarding_completed_at — gesetzt sobald der User durch
-- den Standort- und Kontakt-Step durch ist (auch wenn er beide skipped).
-- Auth-Callback und Onboarding-Layout prüfen das, damit kein User nach
-- erstem Durchlauf nochmal durch die Steps geschoben wird.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.users
  add column if not exists onboarding_completed_at timestamptz;

-- Bestehende User mit gesetztem Standort gelten als durch's Onboarding
-- durch — sie haben den entscheidenden Schritt schon hinter sich.
update public.users u
   set onboarding_completed_at = now()
 where u.onboarding_completed_at is null
   and exists (
     select 1 from public.user_locations l where l.user_id = u.id
   );
