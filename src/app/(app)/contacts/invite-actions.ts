"use server";

import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";

/**
 * Holt oder erstellt den persönlichen Invite-Link des Users (PRD §6.7).
 * Pro User reicht ein langlebiger Link — wir verwenden den ersten ohne
 * `target_phone_hash` und ohne Ablauf.
 */
export async function getOrCreatePersonalInvite(): Promise<{
  token: string;
}> {
  const me = await requireUserId();
  const sb = admin();

  const { data: existing } = await sb
    .from("invites")
    .select("link_token")
    .eq("inviter_id", me)
    .is("target_phone_hash", null)
    .is("expires_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { token: (existing as { link_token: string }).link_token };
  }

  const { data: created, error } = await sb
    .from("invites")
    .insert({ inviter_id: me } as never)
    .select("link_token")
    .single();
  if (error) throw error;
  return { token: (created as { link_token: string }).link_token };
}
