"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneIcon, UserIcon } from "@/components/icons";
import { saveOnboardingProfile } from "../actions";

type Props = {
  defaults: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    phone: string | null;
  };
};

export function ProfileStep({ defaults }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await saveOnboardingProfile(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <Input
        type="text"
        name="first_name"
        required
        defaultValue={defaults.first_name ?? ""}
        placeholder="Vorname"
        leading={<UserIcon size={18} />}
        autoComplete="given-name"
        autoCapitalize="words"
      />
      <Input
        type="text"
        name="last_name"
        required
        defaultValue={defaults.last_name ?? ""}
        placeholder="Nachname"
        autoComplete="family-name"
        autoCapitalize="words"
      />
      <Input
        type="tel"
        name="phone"
        required
        defaultValue={defaults.phone ?? ""}
        placeholder="+49 170 1234567"
        leading={<PhoneIcon size={18} />}
        autoComplete="tel"
        inputMode="tel"
        hint="Pflichtfeld — wir nutzen die Nummer fürs Adressbuch-Matching."
      />
      <Input
        type="text"
        name="username"
        defaultValue={defaults.username ?? ""}
        placeholder="username (optional)"
        autoCapitalize="none"
        autoComplete="username"
        inputMode="text"
        hint="Für deinen QR-Code und persönlichen Add-Link."
      />

      {error && <div className="t-body-s text-error">{error}</div>}

      <Button type="submit" block disabled={pending}>
        {pending ? "Wird gespeichert …" : "Weiter"}
      </Button>
    </form>
  );
}
