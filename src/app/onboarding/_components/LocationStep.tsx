"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MapPinIcon } from "@/components/icons";
import { setMyOrbit } from "../location/actions";

type Phase = "idle" | "asking" | "resolving" | "done" | "error";

export function LocationStep({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [resolved, setResolved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function requestLocation() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Standort wird auf diesem Gerät nicht unterstützt.");
      setPhase("error");
      return;
    }
    setPhase("asking");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setPhase("resolving");
        const res = await setMyOrbit({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        if (res.error) {
          setError(res.error);
          setPhase("error");
          return;
        }
        setResolved(res.orbit ?? null);
        setPhase("done");
      },
      (err) => {
        setError(err.message || "Standort wurde nicht freigegeben.");
        setPhase("error");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
  }

  if (phase === "done") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-surface-accent hairline rounded-[var(--radius-l)] p-5 paper-edge text-center">
          <div className="t-label-s text-ink-secondary mb-1">
            Du bist in
          </div>
          <div className="t-display-m text-ink-primary">
            {resolved ?? "—"}
          </div>
        </div>
        <Button
          block
          onClick={() => router.push("/onboarding/contacts")}
        >
          Weiter
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        block
        onClick={requestLocation}
        disabled={phase === "asking" || phase === "resolving"}
      >
        <MapPinIcon size={18} />
        {phase === "asking"
          ? "Warte auf Freigabe …"
          : phase === "resolving"
          ? "Stadt wird erkannt …"
          : "Standort freigeben"}
      </Button>
      {error && <div className="t-body-s text-error text-left">{error}</div>}
      {phase === "error" && (
        <button
          onClick={() => router.push("/onboarding/contacts")}
          className="t-label-m text-postage block w-full pt-2"
        >
          Später festlegen — überspringen
        </button>
      )}
    </div>
  );
}
