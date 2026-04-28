"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMeetup } from "./actions";

export function CancelMeetupBtn({ meetupId }: { meetupId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="t-label-m text-error w-full py-3"
      >
        Meetup absagen
      </button>
    );
  }

  return (
    <div className="t-body-m text-ink-secondary text-center space-y-2 pt-2">
      <div>Wirklich absagen? Alle Teilnehmer werden informiert.</div>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setConfirming(false)}
          className="t-label-m text-ink-tertiary px-3"
        >
          Doch nicht
        </button>
        <button
          onClick={() =>
            startTransition(async () => {
              const res = await cancelMeetup(meetupId);
              if (res.ok) router.push("/calendar");
            })
          }
          disabled={pending}
          className="t-label-m text-error px-3"
        >
          {pending ? "…" : "Ja, absagen"}
        </button>
      </div>
    </div>
  );
}
