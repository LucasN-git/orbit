"use client";

import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShareIcon } from "@/components/icons";
import { getOrCreatePersonalInvite } from "@/app/(app)/contacts/invite-actions";

/**
 * Persönlicher Invite-Link (PRD §6.7). Lädt den Token lazy beim Mount,
 * öffnet Web-Share-API oder kopiert in Zwischenablage als Fallback.
 */
export function InviteCard({
  inviterName,
  mutualCount,
}: {
  inviterName: string;
  mutualCount: number;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const res = await getOrCreatePersonalInvite();
      setToken(res.token);
    });
  }, []);

  const url =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/i/${token}`
      : "";

  const text = `${inviterName} hat dich zu Orbit eingeladen. Finde heraus, wer von euren Leuten gerade in deiner Stadt ist.${
    mutualCount > 0 ? ` ${mutualCount} eurer gemeinsamen Freunde sind schon dabei.` : ""
  }`;

  async function share() {
    if (!url) return;
    setCopied(false);
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (!nav) return;
      if (typeof nav.share === "function") {
        await nav.share({ title: "orbit", text, url });
        return;
      }
      if (nav.clipboard) {
        await nav.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
      }
    } catch {
      // user cancel
    }
  }

  return (
    <Card className="space-y-3">
      <div className="t-label-l text-ink-primary">Dein Einladungs-Link</div>
      <p className="t-body-m text-ink-secondary">
        Schick den Link an die Leute, die du auf Orbit haben willst.
        Orbit lebt vom Netzwerk — je mehr Kontakte da sind, desto voller
        wird dein Orbit.
      </p>
      <div className="t-mono text-ink-tertiary truncate">
        {loading ? "Wird vorbereitet …" : url || "—"}
      </div>
      <Button block onClick={share} disabled={!token}>
        <ShareIcon size={18} />
        {copied ? "Link kopiert" : "Link teilen"}
      </Button>
    </Card>
  );
}
