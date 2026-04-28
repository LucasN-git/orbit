-- ─────────────────────────────────────────────────────────────────────────
-- 0014_user_profile
-- public.users.phone — Klartext-Telefonnummer in E.164 (z.B. +491701234567).
-- Bisher hatten wir nur `phone_hash` (für DSGVO-konformes Adressbuch-Matching,
-- PRD §11.2). Für das Profil-Editing braucht der User aber seine echte Nummer
-- als bearbeitbares Feld zurück sehen können.
--
-- Onboarding zwingt ab jetzt Vorname / Nachname / Telefon (App-Layer-Check
-- in `markOnboardingComplete`). DB lässt die Spalten weiterhin nullable, damit
-- Bestandsuser nicht beim Login crashen.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.users
  add column if not exists phone text;

-- E.164-Form prüfen: optionales +, danach 8–15 Ziffern. Nullable bleibt.
alter table public.users
  add constraint users_phone_e164_chk
  check (phone is null or phone ~ '^\+?[0-9]{8,15}$');
