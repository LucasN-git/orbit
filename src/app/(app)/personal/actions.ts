"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";
import { hashPhone, normalizeToE164 } from "@/lib/phone";
import { TAGS } from "@/lib/cache-tags";

export async function updateShareLocation(value: boolean): Promise<void> {
  const me = await requireUserId();
  await admin()
    .from("user_settings")
    .update({ share_location: value } as never)
    .eq("user_id", me);
  updateTag(TAGS.user);
  revalidatePath("/personal");
}

export async function updateMutualMinFriends(value: number): Promise<void> {
  const me = await requireUserId();
  const clamped = Math.max(1, Math.min(50, Math.round(value)));
  await admin()
    .from("user_settings")
    .update({ mutual_min_friends: clamped } as never)
    .eq("user_id", me);
  updateTag(TAGS.user);
  updateTag(TAGS.orbit);
  revalidatePath("/personal");
  revalidatePath("/");
}

export async function updateNotificationPref(
  key: string,
  value: boolean,
): Promise<void> {
  const me = await requireUserId();
  const sb = admin();
  const { data: row } = await sb
    .from("user_settings")
    .select("notification_prefs")
    .eq("user_id", me)
    .maybeSingle();
  const current =
    ((row as { notification_prefs?: Record<string, boolean> } | null)
      ?.notification_prefs ?? {}) as Record<string, boolean>;
  const next = { ...current, [key]: value };
  await sb
    .from("user_settings")
    .update({ notification_prefs: next } as never)
    .eq("user_id", me);
  updateTag(TAGS.user);
  revalidatePath("/personal");
}

export async function refreshMyLocation({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}): Promise<{ orbit?: string; error?: string }> {
  const me = await requireUserId();
  const sb = admin();

  type OrbitRow = {
    id: string;
    name: string;
    type: "city" | "country" | "region";
    centroid_lat: number;
    centroid_lng: number;
  };
  const { data: orbits } = await sb
    .from("orbits")
    .select("id, name, type, centroid_lat, centroid_lng")
    .eq("published", true)
    .not("centroid_lat", "is", null);
  const rows = (orbits ?? []) as OrbitRow[];

  const weight: Record<OrbitRow["type"], number> = {
    city: 0,
    region: 1,
    country: 2,
  };
  let best: OrbitRow | null = null;
  let bestKey = Number.POSITIVE_INFINITY;
  for (const o of rows) {
    const d = haversine(lat, lng, o.centroid_lat, o.centroid_lng);
    const cap = o.type === "city" ? 80 : o.type === "region" ? 250 : 5000;
    if (d > cap) continue;
    const key = weight[o.type] * 10_000 + d;
    if (key < bestKey) {
      bestKey = key;
      best = o;
    }
  }
  if (!best) return { error: "Keine Stadt in der Nähe gefunden." };

  await sb
    .from("user_locations")
    .upsert(
      {
        user_id: me,
        orbit_id: best.id,
        last_seen_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id" },
    );
  updateTag(TAGS.user);
  updateTag(TAGS.orbit);
  revalidatePath("/personal");
  revalidatePath("/");
  return { orbit: best.name };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/onboarding");
}

export type UpdateProfileResult =
  | { ok: true }
  | { error: string; field?: "first_name" | "last_name" | "phone" | "username" };

/**
 * Profil bearbeiten. Selbe Pflichtfeld-Regel wie im Onboarding (Vorname,
 * Nachname, Telefon). Telefonnummer wird normalisiert und mit-gehasht,
 * damit das Adressbuch-Match-Trigger danach wieder konsistent ist.
 */
export async function updateProfile(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const me = await requireUserId();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "").trim();

  if (!firstName) return { error: "Vorname fehlt.", field: "first_name" };
  if (!lastName) return { error: "Nachname fehlt.", field: "last_name" };
  if (!phoneRaw) return { error: "Telefonnummer fehlt.", field: "phone" };

  const phone = normalizeToE164(phoneRaw);
  if (!phone) {
    return {
      error: "Telefonnummer ungültig. Beispiel: +49 170 1234567",
      field: "phone",
    };
  }
  const phone_hash = hashPhone(phone);

  let username: string | null = null;
  if (usernameRaw) {
    username = usernameRaw.toLowerCase().replace(/^@+/, "");
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return {
        error:
          "Username darf nur Kleinbuchstaben, Ziffern, _ und . enthalten (3–20 Zeichen).",
        field: "username",
      };
    }
  }

  const { error } = await admin()
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      phone_hash,
      username,
    } as never)
    .eq("id", me);

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Diese Telefonnummer oder dieser Username ist schon vergeben.",
      };
    }
    return { error: error.message };
  }

  updateTag(TAGS.user);
  revalidatePath("/personal");
  revalidatePath("/personal/edit");
  return { ok: true };
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
