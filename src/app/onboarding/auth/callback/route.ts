import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + Magic-Link-Callback. Tauscht den `code`-Parameter gegen eine
 * Session, markiert die Email als verifiziert (User hat ja gerade einen
 * Link aus seinem Postfach bestätigt) und redirected dann:
 *   - User hat bereits einen Standort → zurück in die App
 *   - sonst → Onboarding-Standort-Schritt
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
  if (userId) {
    // Email-Verify markieren, falls noch nicht gesetzt. RLS lässt den
    // gerade authentifizierten User sein eigenes Profil aktualisieren.
    await supabase
      .from("users")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("id", userId)
      .is("email_verified_at", null);

    // Wenn Onboarding (Standort) schon erledigt ist, direkt in die App.
    const { data: loc } = await supabase
      .from("user_locations")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (loc) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/onboarding/location`);
}
