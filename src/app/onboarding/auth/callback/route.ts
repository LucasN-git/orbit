import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + Magic-Link-Callback. Tauscht den `code`-Parameter gegen eine
 * Session und leitet dann in den nächsten Onboarding-Schritt weiter
 * (Standort). Wenn der User schon einen Standort gesetzt hat, leitet
 * Onboarding-Layout auf die App weiter — siehe layout.tsx.
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

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/onboarding/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/onboarding/location`);
}
