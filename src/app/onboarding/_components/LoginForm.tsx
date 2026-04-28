"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EnvelopeIcon, LockIcon } from "@/components/icons";
import {
  sendMagicLink,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "../actions";

type Mode = "magic" | "password";
type PwSubMode = "signin" | "signup";

export function LoginForm({
  error,
  sent,
}: {
  error?: string;
  sent?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(error ?? null);
  const [sentTo, setSentTo] = useState<string | null>(sent ?? null);
  const [confirmTo, setConfirmTo] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("magic");
  const [pwSub, setPwSub] = useState<PwSubMode>("signin");

  function handleMagicLink(formData: FormData) {
    setLocalError(null);
    startTransition(async () => {
      const res = await sendMagicLink(formData);
      if (res?.error) {
        setLocalError(res.error);
      } else if (res?.ok) {
        setSentTo(res.email);
      }
    });
  }

  function handlePassword(formData: FormData) {
    setLocalError(null);
    startTransition(async () => {
      const res =
        pwSub === "signin"
          ? await signInWithPassword(formData)
          : await signUpWithPassword(formData);
      if (res?.error) {
        setLocalError(res.error);
      } else if (res && "confirm" in res && res.confirm) {
        setConfirmTo(res.email);
      }
    });
  }

  function handleGoogle() {
    setLocalError(null);
    startTransition(async () => {
      const res = await signInWithGoogle();
      if (res?.error) {
        setLocalError(res.error);
      }
    });
  }

  if (sentTo) {
    return (
      <Inbox
        title="Briefkasten checken"
        body={
          <>
            Wir haben dir einen Link an{" "}
            <strong className="text-ink-primary">{sentTo}</strong> geschickt.
            Klick drauf und du bist drin.
          </>
        }
        onReset={() => setSentTo(null)}
      />
    );
  }

  if (confirmTo) {
    return (
      <Inbox
        title="Email bestätigen"
        body={
          <>
            Wir haben einen Bestätigungslink an{" "}
            <strong className="text-ink-primary">{confirmTo}</strong>{" "}
            geschickt. Klick drauf, dann kannst du dich anmelden.
          </>
        }
        onReset={() => setConfirmTo(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="secondary"
        block
        onClick={handleGoogle}
        disabled={pending}
      >
        <GoogleGlyph />
        Mit Google anmelden
      </Button>

      <div className="flex items-center gap-3 my-2">
        <span className="flex-1 h-px bg-hairline/40" />
        <span className="t-label-s text-ink-tertiary">oder</span>
        <span className="flex-1 h-px bg-hairline/40" />
      </div>

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === "magic" ? (
        <form action={handleMagicLink} className="space-y-3">
          <Input
            type="email"
            name="email"
            required
            placeholder="deine@email.de"
            leading={<EnvelopeIcon size={18} />}
            autoComplete="email"
            inputMode="email"
          />
          <Button type="submit" block disabled={pending}>
            {pending ? "Wird gesendet …" : "Magic-Link schicken"}
          </Button>
        </form>
      ) : (
        <form action={handlePassword} className="space-y-3">
          <Input
            type="email"
            name="email"
            required
            placeholder="deine@email.de"
            leading={<EnvelopeIcon size={18} />}
            autoComplete="email"
            inputMode="email"
          />
          <Input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="Passwort"
            leading={<LockIcon size={18} />}
            autoComplete={
              pwSub === "signin" ? "current-password" : "new-password"
            }
          />
          <Button type="submit" block disabled={pending}>
            {pending
              ? pwSub === "signin"
                ? "Wird angemeldet …"
                : "Wird angelegt …"
              : pwSub === "signin"
                ? "Anmelden"
                : "Konto anlegen"}
          </Button>
          <button
            type="button"
            onClick={() =>
              setPwSub(pwSub === "signin" ? "signup" : "signin")
            }
            className="t-label-m text-postage block w-full text-center pt-1"
          >
            {pwSub === "signin"
              ? "Noch kein Konto? Registrieren"
              : "Schon ein Konto? Anmelden"}
          </button>
        </form>
      )}

      {localError && (
        <div className="t-body-s text-error">{localError}</div>
      )}

      <p className="t-body-s text-ink-tertiary mt-6">
        Mit dem Anmelden akzeptierst du unsere AGB und unsere
        Datenschutzerklärung.
      </p>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex p-1 rounded-[var(--radius-pill)] bg-sunken hairline"
    >
      <ToggleTab
        active={mode === "magic"}
        onClick={() => onChange("magic")}
        label="Magic-Link"
      />
      <ToggleTab
        active={mode === "password"}
        onClick={() => onChange("password")}
        label="Passwort"
      />
    </div>
  );
}

function ToggleTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 h-9 t-label-m rounded-[var(--radius-pill)] transition-colors ${
        active
          ? "bg-canvas text-ink-primary shadow-[var(--shadow-card)]"
          : "text-ink-tertiary"
      }`}
    >
      {label}
    </button>
  );
}

function Inbox({
  title,
  body,
  onReset,
}: {
  title: string;
  body: React.ReactNode;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-surface-accent hairline rounded-[var(--radius-l)] p-5">
        <div className="t-label-l text-ink-primary mb-1">{title}</div>
        <p className="t-body-m text-ink-secondary">{body}</p>
      </div>
      <button onClick={onReset} className="t-label-m text-postage">
        Andere Adresse verwenden
      </button>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.5 12.27c0-.74-.07-1.45-.2-2.13H12v4.04h5.91a5.06 5.06 0 0 1-2.19 3.32v2.76h3.54c2.07-1.91 3.24-4.72 3.24-7.99Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.76c-.98.66-2.23 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.55H2.16v2.86A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.83 14.08A6.6 6.6 0 0 1 5.46 12c0-.72.13-1.43.37-2.08V7.06H2.16A11 11 0 0 0 1 12c0 1.78.43 3.46 1.16 4.94l3.67-2.86Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.36c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.46 2.07 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.06l3.67 2.86c.87-2.61 3.3-4.56 6.17-4.56Z"
      />
    </svg>
  );
}
