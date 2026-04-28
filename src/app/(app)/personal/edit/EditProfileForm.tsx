"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";
import { updateProfile } from "../actions";

type Props = {
  defaults: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    username: string | null;
    phone: string | null;
  };
};

export function EditProfileForm({ defaults }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        type="text"
        name="first_name"
        label="Vorname"
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
        label="Nachname"
        required
        defaultValue={defaults.last_name ?? ""}
        placeholder="Nachname"
        autoComplete="family-name"
        autoCapitalize="words"
      />
      <Input
        type="tel"
        name="phone"
        label="Telefonnummer"
        required
        defaultValue={defaults.phone ?? ""}
        placeholder="+49 170 1234567"
        leading={<PhoneIcon size={18} />}
        autoComplete="tel"
        inputMode="tel"
        hint="Pflichtfeld — wir nutzen sie fürs Adressbuch-Matching."
      />
      <Input
        type="text"
        name="username"
        label="Username"
        defaultValue={defaults.username ?? ""}
        placeholder="username (optional)"
        autoCapitalize="none"
        autoComplete="username"
        inputMode="text"
        hint="Optional — für deinen QR- und Add-Link."
      />
      <Input
        type="email"
        label="Email"
        defaultValue={defaults.email ?? ""}
        leading={<EnvelopeIcon size={18} />}
        disabled
        readOnly
        hint="Email-Änderung läuft über Login → noch nicht im Profil bearbeitbar."
      />

      {error && <div className="t-body-s text-error">{error}</div>}
      {saved && !error && (
        <div className="t-body-s text-postage italic-display">
          Gespeichert.
        </div>
      )}

      <Button type="submit" block disabled={pending}>
        {pending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}
