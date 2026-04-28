import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client mit dem Service-Role-Key.
 * Bypasst RLS — NIEMALS aus dem Browser importieren.
 *
 * Dev-Phase: wir haben noch keine echte Auth-Session. Alle Server Components
 * lesen mit diesem Client und filtern manuell auf DEV_USER_ID. Sobald der
 * Onboarding-/Auth-Flow steht, ersetzen wir die meisten Calls durch den
 * normalen `server.ts`-Client (mit RLS).
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

/**
 * UUID des Dev-Users, dessen Sicht die App während der Auth-losen Phase
 * darstellt. Wird in `.env.local` gesetzt — siehe `supabase/dev_seed.sql`.
 */
export function devUserId(): string {
  const id = process.env.DEV_USER_ID;
  if (!id) {
    throw new Error(
      "DEV_USER_ID is not set. Run supabase/dev_seed.sql and copy the printed UUID into .env.local.",
    );
  }
  return id;
}
