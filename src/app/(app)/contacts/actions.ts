"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";

/**
 * Add-via-Username (PRD §6.6 — Snapchat-Style: Username/QR/Deep-Link).
 *
 * Sucht den User nach Username, legt einen `friend_links`-Eintrag an
 * (status=pending bis der andere zustimmt). Im echten iOS-Build kommt der
 * Trigger via contacts-Hash-Match dazu — hier ist das der manuelle Pfad.
 */
export async function addContactByUsername(
  username: string,
): Promise<
  | { ok: true; user: { id: string; name: string } }
  | { ok: false; error: string }
> {
  const me = await requireUserId();
  const sb = admin();
  const handle = username.trim().replace(/^@/, "");
  if (!handle) return { ok: false, error: "Bitte gib einen Username ein." };

  const { data: matchRaw } = await sb
    .from("users")
    .select("id, first_name, last_name, username")
    .ilike("username", handle)
    .maybeSingle();
  const match = matchRaw as
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        username: string | null;
      }
    | null;
  if (!match) return { ok: false, error: "Kein User mit dem Namen." };
  if (match.id === me)
    return { ok: false, error: "Du kannst dich nicht selbst hinzufügen." };

  const a = me < match.id ? me : match.id;
  const b = me < match.id ? match.id : me;
  const { error } = await sb.from("friend_links").upsert(
    { user_a: a, user_b: b, status: "mutual" } as never,
    { onConflict: "user_a,user_b" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/contacts");
  revalidatePath("/");
  revalidatePath("/personal");

  const name =
    [match.first_name, match.last_name].filter(Boolean).join(" ") ||
    match.username ||
    "—";
  return { ok: true, user: { id: match.id, name } };
}

export async function removeContact(otherId: string): Promise<void> {
  const me = await requireUserId();
  const sb = admin();
  const a = me < otherId ? me : otherId;
  const b = me < otherId ? otherId : me;
  await sb
    .from("friend_links")
    .delete()
    .eq("user_a", a)
    .eq("user_b", b);
  revalidatePath("/contacts");
  revalidatePath("/");
}
