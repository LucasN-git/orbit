import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client mit dem Service-Role-Key.
 * Bypasst RLS — NIEMALS aus dem Browser importieren.
 *
 * Identität kommt aus `requireUserId()` (Auth-Session). data.ts filtert
 * Queries manuell auf diese ID, bis RLS-Policies stehen — dann fällt der
 * Service-Role-Pfad weg und Calls wechseln zum session-basierten Client
 * in `server.ts`.
 *
 * Untyped — sobald `supabase gen types typescript` läuft, kommt die Database-
 * Generic dazu. Bis dahin kasten wir Query-Results in data.ts manuell.
 */
let cached: ReturnType<typeof createClient> | null = null;

export function admin() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
