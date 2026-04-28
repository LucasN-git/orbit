"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";

export type CreateTripInput = {
  orbitId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  parentTripId?: string | null;
  participantIds?: string[];
};

export async function createTrip(
  input: CreateTripInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const me = await requireUserId();
  const sb = admin();

  if (!input.orbitId) return { ok: false, error: "Bitte wähle eine Stadt." };
  if (!input.startDate || !input.endDate)
    return { ok: false, error: "Datum unvollständig." };
  if (input.startDate > input.endDate)
    return { ok: false, error: "Enddatum liegt vor Startdatum." };

  const { data: created, error } = await sb
    .from("trips")
    .insert({
      user_id: me,
      orbit_id: input.orbitId,
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason?.trim() || null,
      parent_trip_id: input.parentTripId || null,
    } as never)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  const tripId = (created as { id: string }).id;

  const participants = (input.participantIds ?? [])
    .filter((id) => id && id !== me)
    .map((user_id) => ({ trip_id: tripId, user_id }));
  if (participants.length > 0) {
    const { error: pErr } = await sb
      .from("trip_participants")
      .insert(participants as never);
    if (pErr) return { ok: false, error: pErr.message };
  }

  revalidatePath("/trips");
  return { ok: true, id: tripId };
}

export async function deleteTrip(
  tripId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireUserId();
  const sb = admin();
  const { error } = await sb
    .from("trips")
    .delete()
    .eq("id", tripId)
    .eq("user_id", me);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/trips");
  return { ok: true };
}
