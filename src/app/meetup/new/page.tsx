import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";
import { fullName, toneFor, type Tone } from "@/lib/data-helpers";
import { MeetupForm } from "./MeetupForm";

type Search = Promise<{ from?: string }>;

export default async function NewMeetupPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const me = await requireUserId();
  const sb = admin();
  const { from } = await searchParams;

  // Pre-fill aus „Reschedule" — original-Meetup laden, Datum entfernen.
  let prefill:
    | {
        title: string;
        time: string | null;
        location: string | null;
        category: string | null;
        description: string | null;
        participantIds: string[];
      }
    | null = null;

  if (from) {
    const { data: m } = await sb
      .from("meetups")
      .select("title, time, location, category, description, creator_id")
      .eq("id", from)
      .maybeSingle();
    if (m) {
      const { data: parts } = await sb
        .from("meetup_participants")
        .select("participant_id")
        .eq("meetup_id", from);
      const meetup = m as {
        title: string;
        time: string | null;
        location: string | null;
        category: string | null;
        description: string | null;
        creator_id: string;
      };
      prefill = {
        title: meetup.title,
        time: meetup.time,
        location: meetup.location,
        category: meetup.category,
        description: meetup.description,
        participantIds: (
          (parts ?? []) as { participant_id: string | null }[]
        )
          .map((p) => p.participant_id)
          .filter((id): id is string => !!id && id !== me)
          // Original-Creator als Teilnehmer für den Reschedule
          .concat(meetup.creator_id !== me ? [meetup.creator_id] : []),
      };
    }
  }

  // Mutuals-Liste für Teilnehmer-Picker
  const mutuals = await loadMutualsForPicker(me);

  return <MeetupForm prefill={prefill} mutuals={mutuals} />;
}

async function loadMutualsForPicker(meId: string) {
  const sb = admin();
  const { data: links } = await sb
    .from("friend_links")
    .select("user_a, user_b")
    .eq("status", "mutual")
    .or(`user_a.eq.${meId},user_b.eq.${meId}`);
  const mutualIds = ((links ?? []) as { user_a: string; user_b: string }[])
    .map((l) => (l.user_a === meId ? l.user_b : l.user_a));
  if (mutualIds.length === 0) return [];

  const { data: users } = await sb
    .from("users")
    .select("id, first_name, last_name")
    .in("id", mutualIds);

  return (
    (users ?? []) as {
      id: string;
      first_name: string | null;
      last_name: string | null;
    }[]
  )
    .map((u) => ({
      id: u.id,
      name: fullName(u),
      tone: toneFor(u.id) as Tone,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
