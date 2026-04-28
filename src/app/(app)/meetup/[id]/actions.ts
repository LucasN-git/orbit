"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";

export type RespondInput = {
  meetupId: string;
  response: "accepted" | "declined" | "reschedule";
  message?: string | null;
};

export async function respondToMeetup(
  input: RespondInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireUserId();
  const sb = admin();

  const update = {
    response: input.response,
    response_message: input.message?.trim() || null,
  };

  const { error, data } = await sb
    .from("meetup_participants")
    .update(update as never)
    .eq("meetup_id", input.meetupId)
    .eq("participant_id", me)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || (data as { id: string }[]).length === 0) {
    return { ok: false, error: "Du bist nicht Teilnehmer dieses Meetups." };
  }

  revalidatePath(`/meetup/${input.meetupId}`);
  revalidatePath("/calendar");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function cancelMeetup(
  meetupId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireUserId();
  const sb = admin();
  const { error } = await sb
    .from("meetups")
    .update({ status: "cancelled" } as never)
    .eq("id", meetupId)
    .eq("creator_id", me);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendar");
  return { ok: true };
}
