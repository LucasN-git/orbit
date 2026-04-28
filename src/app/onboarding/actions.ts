"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
  redirect("/onboarding/location");
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
    redirect("/onboarding/location");
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
