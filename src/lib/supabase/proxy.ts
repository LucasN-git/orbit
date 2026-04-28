import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth-Gate + Session-Refresh.
 *
 * Routen, die ohne Login erreichbar sein müssen:
 *   - /onboarding/*  (Splash, Login, Standort, Kontakte, Auth-Callback)
 *   - /m/*           (Gastmodus für Meetup-Einladungen, PRD §4.2)
 *
 * Dev-Bypass: aktiv wenn NODE_ENV=development UND DEV_USER_ID gesetzt.
 * `next dev` setzt NODE_ENV immer auf "development"; `next build && next
 * start` und Vercel-Deploys setzen "production". Selbst wenn DEV_USER_ID
 * versehentlich in Vercel-Env steht, kann der Bypass dort nicht zünden.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Direkt nach createServerClient — kein Code dazwischen.
  // getUser() refresht das Session-Cookie, damit der User eingeloggt bleibt.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthGated(request, user)) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/m/") ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/auth/")
  );
}

function isDevBypassActive(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    !!process.env.DEV_USER_ID
  );
}

function isAuthGated(
  request: NextRequest,
  user: { id: string } | null,
): boolean {
  if (user) return false; // eingeloggt → durchlassen
  if (isPublicPath(request.nextUrl.pathname)) return false;
  if (isDevBypassActive()) return false;
  return true; // gated → redirect
}
