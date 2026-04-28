"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { hashPhone, normalizeToE164 } from "@/lib/phone";

/**
 * Bevorzugt NEXT_PUBLIC_SITE_URL (in Vercel-Env gesetzt), fällt sonst auf
 * x-forwarded-* zurück. Wichtig damit Magic-Links / OAuth-Callbacks auch
 * dann auf die Production-Domain zeigen, wenn die Action hinter Edge-
 * Proxies läuft.
 */
function siteOrigin(h: Headers) {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function validateEmail(formData: FormData): string | null {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) return null;
  return email;
}

/**
 * Email Magic Link senden.
 * Funktioniert ohne externe OAuth-Konfig — Supabase verschickt die Mail
 * via SMTP des Projekts.
 */
export async function sendMagicLink(formData: FormData) {
  const email = validateEmail(formData);
  if (!email) return { error: "Bitte gib eine gültige Email-Adresse ein." };

  const supabase = await createClient();
  const origin = siteOrigin(await headers());

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/onboarding/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { ok: true, email };
}

/**
 * Email + Passwort Login. Setzt direkt eine Session und redirected in den
 * nächsten Onboarding-Schritt; bei Fehler kommt die Message zurück.
 */
export async function signInWithPassword(formData: FormData) {
  const email = validateEmail(formData);
  if (!email) return { error: "Bitte gib eine gültige Email-Adresse ein." };
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Passwort fehlt oder ist zu kurz." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email oder Passwort stimmt nicht." };
  }
  redirect("/onboarding/profile");
}

/**
 * Email + Passwort Registrierung. Wenn Supabase "Confirm email" an hat,
 * gibt's eine Bestätigungsmail und wir zeigen den entsprechenden Hinweis.
 * Wenn aus, wird der User sofort eingeloggt.
 */
export async function signUpWithPassword(formData: FormData) {
  const email = validateEmail(formData);
  if (!email) return { error: "Bitte gib eine gültige Email-Adresse ein." };
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Passwort muss mindestens 6 Zeichen haben." };
  }

  const supabase = await createClient();
  const origin = siteOrigin(await headers());

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/onboarding/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Session da → Email-Bestätigung ist deaktiviert, User ist drin.
  if (data.session) {
    redirect("/onboarding/profile");
  }

  // Sonst: Bestätigungsmail wartet im Postfach.
  return { ok: true, email, confirm: true as const };
}

/**
 * Google OAuth starten. Funktioniert nur, sobald der Provider im Supabase-
 * Dashboard unter Authentication → Providers verdrahtet ist.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = siteOrigin(await headers());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/onboarding/auth/callback`,
    },
  });

  if (error) {
    // Provider nicht konfiguriert oder ähnliches.
    return { error: error.message };
  }
  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Onboarding-Flag setzen (idempotent — `is null`-Check verhindert Overwrites).
 * Wird vom Contacts-Step gerufen, sobald der User entweder fertig oder
 * explizit übersprungen hat. Beim nächsten Login redirected der Auth-
 * Callback dann direkt in die App, nicht mehr zurück ins Onboarding.
 *
 * Profil-Pflichtfelder werden hier nochmal serverseitig geprüft — falls der
 * User irgendwie an `/onboarding/profile` vorbei gekommen ist, fällt das
 * spätestens hier auf und wir lassen ihn nicht weiter.
 */
export async function markOnboardingComplete() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const sb = admin();
  const { data: profile } = await sb
    .from("users")
    .select("first_name, last_name, phone")
    .eq("id", user.id)
    .maybeSingle();
  const p = profile as
    | { first_name: string | null; last_name: string | null; phone: string | null }
    | null;
  if (!p?.first_name?.trim() || !p?.last_name?.trim() || !p?.phone) {
    return { error: "Profil unvollständig." };
  }

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("onboarding_completed_at", null);

  if (error) return { error: error.message };
  return { ok: true as const };
}

/**
 * Onboarding Schritt 2 — Profil. Vorname, Nachname, Telefon (Pflicht), und
 * optional ein Username (für QR / Deep-Link Add, PRD §6.6). Die Telefonnummer
 * wird normalisiert (E.164) und zusätzlich gehasht in `phone_hash` abgelegt,
 * damit der bestehende Adressbuch-Match-Trigger (`handle_contact_match`)
 * sofort gegen Bestandsuser feuert.
 */
export async function saveOnboardingProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();

  if (!firstName) return { error: "Vorname fehlt." };
  if (!lastName) return { error: "Nachname fehlt." };
  if (!phoneRaw) return { error: "Telefonnummer fehlt." };

  const phone = normalizeToE164(phoneRaw);
  if (!phone) {
    return {
      error: "Telefonnummer ungültig. Beispiel: +49 170 1234567",
    };
  }
  const phone_hash = hashPhone(phone);

  // Username optional, aber wenn gesetzt, normalisieren.
  const username = usernameRaw
    ? usernameRaw.toLowerCase().replace(/^@+/, "")
    : null;
  if (username && !/^[a-z0-9_.]{3,20}$/.test(username)) {
    return {
      error:
        "Username darf nur Kleinbuchstaben, Ziffern, _ und . enthalten (3–20 Zeichen).",
    };
  }

  const sb = admin();
  const { error } = await sb
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      phone_hash,
      ...(username ? { username } : {}),
    } as never)
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Diese Telefonnummer oder dieser Username ist schon vergeben.",
      };
    }
    return { error: error.message };
  }

  redirect("/onboarding/location");
}

/**
 * Form-Action-Variante: setzt Flag und redirected. Genutzt vom
 * "Erstmal überspringen"-Link auf /onboarding/contacts.
 */
export async function skipOnboardingAndEnter() {
  await markOnboardingComplete();
  redirect("/");
}

/**
 * Verifizierungsmail an die Adresse des eingeloggten Users schicken.
 * Wir nutzen `signInWithOtp` mit `shouldCreateUser: false` — der User
 * existiert ja schon. Beim Klick auf den Link landet er im Auth-Callback,
 * der `email_verified_at` setzt und in die App redirected.
 */
export async function resendVerifyEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Du bist nicht eingeloggt." };
  }

  const origin = siteOrigin(await headers());
  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      emailRedirectTo: `${origin}/onboarding/auth/callback`,
      shouldCreateUser: false,
    },
  });

  if (error) return { error: error.message };
  return { ok: true, email: user.email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/onboarding");
}
