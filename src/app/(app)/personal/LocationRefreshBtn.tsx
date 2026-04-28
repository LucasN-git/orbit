"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinIcon } from "@/components/icons";
import { refreshMyLocation } from "./actions";

export function LocationRefreshBtn() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "asking" | "resolving">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);

  function trigger() {
    setError(null);
    setResolved(null);
    if (!("geolocation" in navigator)) {
      setError("Standort wird nicht unterstützt.");
      return;
    }
    setPhase("asking");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setPhase("resolving");
        const res = await refreshMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setPhase("idle");
        if (res.error) setError(res.error);
        else {
          setResolved(res.orbit ?? null);
          router.refresh();
        }
      },
      (err) => {
        setPhase("idle");
        setError(err.message);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    );
  }

  return (
    <button
      onClick={trigger}
      disabled={phase !== "idle"}
      className="t-label-m text-postage inline-flex items-center gap-1.5"
    >
      <MapPinIcon size={16} />
      {phase === "asking"
        ? "Warte auf Freigabe …"
        : phase === "resolving"
        ? "Stadt erkennen …"
        : resolved
        ? `Aktualisiert: ${resolved}`
        : error
        ? "Erneut versuchen"
        : "Standort aktualisieren"}
    </button>
  );
}
