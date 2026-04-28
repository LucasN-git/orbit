"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShareIcon, EnvelopeIcon } from "@/components/icons";

/**
 * Web-Mockup-Variante des Kontakt-Sync-Screens.
 *
 * Das echte Adressbuch-Matching passiert im iOS-Build via expo-contacts +
 * Edge Function (PRD §11.2). Im Web haben wir keine Adressbuch-API, also
 * bietet der Screen primär den Invite-Pfad: persönlichen Deep-Link teilen.
 */
export function ContactsStep() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  async function handleShare() {
    setBusy(true);
    const shareData = {
      title: "orbit",
      text: "Henrik hat dich zu Orbit eingeladen. Finde heraus, wer von euren Leuten gerade in deiner Stadt ist.",
      url: typeof window !== "undefined" ? window.location.origin : "",
    };
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (!nav) return;
      if (typeof nav.share === "function") {
        await nav.share(shareData);
      } else if (nav.clipboard) {
        await nav.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShared(true);
      }
    } catch {
      // User hat abgebrochen — nichts tun.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="t-label-l text-ink-primary">
          Lade Freunde ein
        </div>
        <p className="t-body-m text-ink-secondary">
          Orbit lebt vom Netzwerkeffekt. Schick deinen persönlichen Link an
          drei Leute — danach wird's hier voll.
        </p>
        <Button block onClick={handleShare} disabled={busy}>
          <ShareIcon size={18} />
          {busy ? "Öffne …" : "Link teilen"}
        </Button>
        {shared && (
          <p className="t-body-s text-postage italic-display">
            Link in die Zwischenablage kopiert.
          </p>
        )}
      </Card>

      <Card className="space-y-3 bg-sunken">
        <div className="flex items-center gap-2 t-label-s text-ink-secondary">
          <EnvelopeIcon size={16} />
          BALD
        </div>
        <div className="t-body-m text-ink-secondary">
          In der iOS-App matchen wir dein Adressbuch automatisch — gehasht,
          DSGVO-konform, ohne Klartext-Telefonnummern auf dem Server.
        </div>
      </Card>

      <Button
        variant="secondary"
        block
        onClick={() => router.push("/")}
      >
        Fertig — los geht's
      </Button>
    </div>
  );
}
