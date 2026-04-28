import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + Magic-Link-Callback. Tauscht den `code`-Parameter gegen eine
 * Session, markiert die Email als verifiziert (User hat ja gerade einen
 * Link aus seinem Postfach bestätigt) und redirected dann smart:
 *   - Onboarding fertig → zurück in die App
 *   - Standort gesetzt, aber Onboarding noch offen → Contacts-Step
 *   - sonst → Standort-Step
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/onboarding/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/onboarding/location`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/onboarding/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.redirect(`${origin}/onboarding/location`);
  }

  // Email-Verify markieren (idempotent), falls noch null. RLS lässt den
  // gerade authentifizierten User sein eigenes Profil aktualisieren.
  await supabase
    .from("users")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", userId)
    .is("email_verified_at", null);

  // Onboarding-Status für smart redirect.
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed_at, first_name, last_name, phone")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    return NextResponse.redirect(`${origin}/`);
  }

  // Profil unvollständig (Vorname/Nachname/Telefon fehlen) → erst Profil-Step.
  const profileComplete =
    !!profile?.first_name?.trim() &&
    !!profile?.last_name?.trim() &&
    !!profile?.phone;
  if (!profileComplete) {
    return NextResponse.redirect(`${origin}/onboarding/profile`);
  }

  const { data: loc } = await supabase
    .from("user_locations")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return NextResponse.redirect(
    `${origin}${loc ? "/onboarding/contacts" : "/onboarding/location"}`,
  );
}
