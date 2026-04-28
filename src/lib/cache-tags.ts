/**
 * Zentrale Cache-Tags für unstable_cache + Server-Action-Invalidation.
 *
 * Server-Actions rufen updateTag(TAGS.x) für die Domain, die sie ändern —
 * dann wird der next/cache-Layer der entsprechenden Daten-Funktionen
 * invalidiert (read-your-own-writes-Semantik in Next 16). Bestehende
 * revalidatePath-Calls bleiben für den Render-Cache zuständig; die beiden
 * Layer ergänzen sich.
 */
export const TAGS = {
  notifications: "notifications",
  friends: "friends",
  orbit: "orbit",
  trips: "trips",
  meetups: "meetups",
  contacts: "contacts",
  user: "user",
} as const;
