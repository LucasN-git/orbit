"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";

export type CreateMeetupInput = {
  title: string;
  date: string;        // YYYY-MM-DD
  time?: string | null;
  location?: string | null;
  category?: string | null;
  description?: string | null;
  participantIds?: string[];
};

export type CreateMeetupResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createMeetup(
  input: CreateMeetupInput,
): Promise<CreateMeetupResult> {
  const me = await requireUserId();
  const sb = admin();

  if (!input.title?.trim()) return { ok: false, error: "Titel fehlt." };
  if (!input.date) return { ok: false, error: "Datum fehlt." };

  const meetup = {
    creator_id: me,
    title: input.title.trim(),
    date: input.date,
    time: input.time || null,
    location: input.location?.trim() || null,
    category: input.category || null,
    description: input.description?.trim() || null,
    status: "open",
  };

  const { data: created, error } = await sb
    .from("meetups")
    .insert(meetup as never)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  const meetupId = (created as { id: string }).id;

  // Teilnehmer (User-IDs) — das notify_meetup_invite Trigger erzeugt
  // automatisch eine 'invite'-Notification pro Teilnehmer.
  const participants = (input.participantIds ?? [])
    .filter((id) => id && id !== me)
    .map((participant_id) => ({
      meetup_id: meetupId,
      participant_id,
      response: "pending" as const,
    }));
  if (participants.length > 0) {
    const { error: pErr } = await sb
      .from("meetup_participants")
      .insert(participants as never);
    if (pErr) return { ok: false, error: pErr.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true, id: meetupId };
}

export async function createMeetupAndRedirect(input: CreateMeetupInput) {
  const res = await createMeetup(input);
  if (res.ok) {
    redirect(`/meetup/${res.id}`);
  }
  return res;
}
