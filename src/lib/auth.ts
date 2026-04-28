import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Aktive User-ID für Server-Actions.
 *
 * Reihenfolge:
 *   1) echte Auth-Session aus Supabase (`auth.getUser()`)
 *   2) DEV_USER_ID Fallback (Dev-Bypass, identisch zur Logik in proxy.ts)
 *
 * Wirft, wenn keiner gefunden — Server-Actions ohne Identität sind ein Bug.
 */
export async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user.id;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_USER_ID
  ) {
    return process.env.DEV_USER_ID;
  }

  throw new Error("Nicht eingeloggt.");
}
