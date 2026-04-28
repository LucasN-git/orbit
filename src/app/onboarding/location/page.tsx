import { OrbitLogo } from "@/components/OrbitLogo";
import { LocationStep } from "../_components/LocationStep";

/**
 * Screen 2 — Standort freigeben.
 * Im Web-Mockup triggern wir die Geolocation-API; im echten iOS-Build kommt
 * `expo-location` mit „When in Use"-Permission. Beides resolved auf einen
 * Orbit (Reverse-Geocoding via Edge Function in Production).
 */
export default function OnboardingLocation() {
  return (
    <div className="flex flex-col h-full bg-canvas">
      <div className="flex-1 px-6 pt-12 pb-6 flex flex-col items-center text-center">
        <div className="text-postage mb-8">
          <OrbitLogo size={120} rings={4} strokeWidth={1.5} />
        </div>

        <h1 className="t-display-l mb-3">Wo bist du gerade?</h1>
        <p className="t-body-l text-ink-secondary max-w-[300px]">
          Orbit erkennt, in welcher Stadt du bist — nie wo genau.
        </p>

        <p className="t-body-s text-ink-tertiary mt-4 max-w-[280px] italic-display">
          Wir speichern keine GPS-Daten, nur den Städtenamen.
        </p>

        <LocationStep className="w-full mt-auto pt-8" />
      </div>
    </div>
  );
}
