"use client";

import { useState, useTransition } from "react";
import { EnvelopeIcon } from "@/components/icons";
import { resendVerifyEmail } from "@/app/onboarding/actions";

export function EmailVerifyBanner({ email }: { email: string | null }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleResend() {
    setError(null);
    startTransition(async () => {
      const res = await resendVerifyEmail();
      if (res?.error) {
        setError(res.error);
      } else if (res?.ok) {
        setSent(true);
      }
    });
  }

  return (
    <div className="bg-surface-accent hairline rounded-[var(--radius-l)] p-4">
      <div className="flex items-start gap-3">
        <span className="text-stamp shrink-0 mt-0.5">
          <EnvelopeIcon size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="t-label-l text-ink-primary">
            Email jetzt verifizieren
          </div>
          <p className="t-body-s text-ink-secondary mt-1">
            {sent ? (
              <>
                Link unterwegs an{" "}
                <strong className="text-ink-primary">{email}</strong>. Klick
                drauf, dann ist deine Mail bestätigt.
              </>
            ) : (
              <>
                Wir schicken dir einen Bestätigungs-Link an{" "}
                <strong className="text-ink-primary">{email ?? "—"}</strong>.
              </>
            )}
          </p>
          {error && (
            <p className="t-body-s text-error mt-1">{error}</p>
          )}
          {!sent && (
            <button
              type="button"
              onClick={handleResend}
              disabled={pending}
              className="mt-3 t-label-m text-postage disabled:opacity-50"
            >
              {pending ? "Wird gesendet …" : "Mail senden"}
            </button>
          )}
          {sent && (
            <button
              type="button"
              onClick={() => {
                setSent(false);
                handleResend();
              }}
              disabled={pending}
              className="mt-3 t-label-m text-ink-tertiary disabled:opacity-50"
            >
              Nochmal senden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
