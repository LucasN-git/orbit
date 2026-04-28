"use server";

import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";

/**
 * Reverse-Geocoding: GPS rein, Stadt raus, Koordinate verworfen.
 * Vereinfachung für MVP: nearest-centroid gegen die `orbits`-Tabelle. In
 * Production läuft das in einer Edge Function gegen einen externen Geocoder
 * (siehe PRD §11.1) — die Logik bleibt: nichts außer dem Orbit-Namen wird
 * persistiert.
 */
export async function setMyOrbit({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}): Promise<{ orbit?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du bist nicht eingeloggt." };

  // Alle published Orbits laden (Stammdaten, ein paar dutzend Einträge).
  const sb = admin();
  const { data: orbits, error } = await sb
    .from("orbits")
    .select("id, slug, name, type, centroid_lat, centroid_lng")
    .eq("published", true)
    .not("centroid_lat", "is", null);
  if (error) return { error: error.message };

  type Row = {
    id: string;
    slug: string;
    name: string;
    type: "city" | "country" | "region";
    centroid_lat: number;
    centroid_lng: number;
  };
  const rows = (orbits ?? []) as Row[];
  if (rows.length === 0) return { error: "Keine Orbits in der Datenbank." };

  // Cities zuerst gewichten, dann region, dann country — wir wollen die
  // präziseste Auflösung. Innerhalb gleicher Gewichtung: nearest centroid.
  const weight: Record<Row["type"], number> = {
    city: 0,
    region: 1,
    country: 2,
  };
  let best: Row | null = null;
  let bestKey = Number.POSITIVE_INFINITY;
  for (const o of rows) {
    const d = haversine(lat, lng, o.centroid_lat, o.centroid_lng);
    // City innerhalb 80km, region innerhalb 250km, country fallback.
    const cap = o.type === "city" ? 80 : o.type === "region" ? 250 : 5000;
    if (d > cap) continue;
    const key = weight[o.type] * 10_000 + d;
    if (key < bestKey) {
      bestKey = key;
      best = o;
    }
  }
  if (!best) return { error: "Keine Stadt in der Nähe gefunden." };

  // Persistieren — nur orbit_id + Zeitstempel, keine Koordinaten (PRD §11.1).
  // Cast als never, weil der untyped Supabase-Client die Insert-Shape nicht kennt.
  const payload = {
    user_id: user.id,
    orbit_id: best.id,
    last_seen_at: new Date().toISOString(),
  };
  const { error: upErr } = await sb
    .from("user_locations")
    .upsert(payload as never, { onConflict: "user_id" });
  if (upErr) return { error: upErr.message };

  return { orbit: best.name };
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
