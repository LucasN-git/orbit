"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { addContactByUsername } from "./actions";

export function AddByUsername() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addContactByUsername(username);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(`${res.user.name} ist jetzt in deinen Mutuals.`);
      setUsername("");
      router.refresh();
    });
  }

  return (
    <Card className="space-y-3">
      <div className="t-label-l text-ink-primary">
        Neuen Kontakt adden
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Username (z.B. henrik)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" block disabled={pending || !username.trim()}>
          {pending ? "Suche …" : "Hinzufügen"}
        </Button>
      </form>
      {error && <div className="t-body-s text-error">{error}</div>}
      {success && (
        <div className="t-body-s text-postage italic-display">
          {success}
        </div>
      )}
    </Card>
  );
}
