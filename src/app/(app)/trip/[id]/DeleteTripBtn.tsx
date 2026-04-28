"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTrip } from "@/app/trip/new/actions";

export function DeleteTripBtn({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="t-label-m text-error w-full py-3"
      >
        Trip löschen
      </button>
    );
  }

  return (
    <div className="t-body-m text-ink-secondary text-center space-y-2 pt-2">
      <div>Trip wirklich löschen?</div>
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
              const res = await deleteTrip(tripId);
              if (res.ok) router.push("/trips");
            })
          }
          disabled={pending}
          className="t-label-m text-error px-3"
        >
          {pending ? "…" : "Ja, löschen"}
        </button>
      </div>
    </div>
  );
}
