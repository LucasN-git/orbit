"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function originFromHeaders(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Email Magic Link senden.
 * Funktioniert ohne externe OAuth-Konfig — Supabase verschickt die Mail
 * via SMTP des Projekts.
 */
export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Bitte gib eine gültige Email-Adresse ein." };
  }

  const supabase = await createClient();
  const origin = originFromHeaders(await headers());

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
 * Google OAuth starten. Funktioniert nur, sobald der Provider im Supabase-
 * Dashboard unter Authentication → Providers verdrahtet ist.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = originFromHeaders(await headers());

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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/onboarding");
}
