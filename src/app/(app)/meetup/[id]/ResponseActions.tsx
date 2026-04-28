"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { respondToMeetup } from "./actions";

export type ParticipantResponse =
  | "pending"
  | "accepted"
  | "declined"
  | "reschedule";

export function ResponseActions({
  meetupId,
  currentResponse,
}: {
  meetupId: string;
  currentResponse: ParticipantResponse;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);
  const [message, setMessage] = useState("");

  function respond(response: "accepted" | "declined" | "reschedule") {
    setError(null);
    startTransition(async () => {
      const res = await respondToMeetup({
        meetupId,
        response,
        message: response === "declined" ? message : null,
      });
      if (!res.ok) setError(res.error);
      else if (response === "reschedule") {
        router.push(`/meetup/new?from=${meetupId}`);
      }
    });
  }

  if (currentResponse === "accepted") {
    return (
      <Card>
        <div className="t-label-l text-postage mb-2">Du hast zugesagt.</div>
        <p className="t-body-m text-ink-secondary mb-3">
          Hat sich was geändert?
        </p>
        <Button
          variant="secondary"
          block
          onClick={() => respond("declined")}
          disabled={pending}
        >
          Doch nicht — absagen
        </Button>
      </Card>
    );
  }

  if (currentResponse === "declined") {
    return (
      <Card>
        <div className="t-label-l text-error mb-2">Du hast abgesagt.</div>
        <Button
          variant="secondary"
          block
          onClick={() => respond("accepted")}
          disabled={pending}
        >
          Doch zusagen
        </Button>
      </Card>
    );
  }

  if (currentResponse === "reschedule") {
    return (
      <Card>
        <div className="t-label-l text-warning mb-2">
          Du hast einen Gegenvorschlag gemacht.
        </div>
        <Button
          variant="secondary"
          block
          onClick={() => respond("accepted")}
          disabled={pending}
        >
          Doch zusagen
        </Button>
      </Card>
    );
  }

  // pending
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="primary"
          onClick={() => respond("accepted")}
          disabled={pending}
        >
          Zusagen
        </Button>
        <Button
          variant="secondary"
          onClick={() => respond("reschedule")}
          disabled={pending}
        >
          Anderen Termin
        </Button>
      </div>
      {!showDeclineMessage ? (
        <button
          onClick={() => setShowDeclineMessage(true)}
          className="t-label-m text-ink-tertiary w-full py-2"
        >
          Absagen
        </button>
      ) : (
        <Card className="space-y-3">
          <textarea
            rows={2}
            placeholder="Optional: Grund für die Absage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 rounded-[var(--radius-m)] bg-sunken hairline t-body-l outline-none focus:bg-raised focus:border-postage focus:border-[1.5px] placeholder:text-ink-tertiary resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeclineMessage(false)}
              disabled={pending}
            >
              Zurück
            </Button>
            <Button
              variant="primary"
              onClick={() => respond("declined")}
              disabled={pending}
              className="!bg-error"
            >
              Absagen
            </Button>
          </div>
        </Card>
      )}
      {error && <div className="t-body-s text-error">{error}</div>}
    </div>
  );
}
