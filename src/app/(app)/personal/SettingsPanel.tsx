"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon } from "@/components/icons";
import {
  updateMutualMinFriends,
  updateNotificationPref,
  updateShareLocation,
} from "./actions";

type Prefs = Record<string, boolean>;

const NOTIFICATION_LABELS: { key: string; label: string }[] = [
  { key: "invite", label: "Neue Einladungen" },
  { key: "reschedule", label: "Termin-Änderungen" },
  { key: "new_in_orbit_current", label: "Neue Kontakte im aktuellen Orbit" },
  { key: "new_in_orbit_home", label: "Neue Kontakte in der Heimatstadt" },
  { key: "new_signup", label: "Wenn ein Kontakt sich registriert" },
  { key: "trip_overlap", label: "Trip-Overlaps" },
];

export function SettingsPanel({
  shareLocation: initShare,
  mutualMin: initMutual,
  notificationPrefs: initPrefs,
}: {
  shareLocation: boolean;
  mutualMin: number;
  notificationPrefs: Prefs;
}) {
  const [share, setShare] = useState(initShare);
  const [mutual, setMutual] = useState(initMutual);
  const [prefs, setPrefs] = useState<Prefs>(initPrefs);
  const [pushOpen, setPushOpen] = useState(false);
  const [, startTransition] = useTransition();

  function flipShare() {
    const v = !share;
    setShare(v);
    startTransition(() => updateShareLocation(v));
  }

  function setMutualValue(v: number) {
    setMutual(v);
    startTransition(() => updateMutualMinFriends(v));
  }

  function flipPref(key: string) {
    const v = !prefs[key];
    setPrefs({ ...prefs, [key]: v });
    startTransition(() => updateNotificationPref(key, v));
  }

  return (
    <Card className="p-0 overflow-hidden">
      <ul>
        {/* Standort teilen */}
        <SettingRow
          label="Standort teilen"
          hint={share ? "An — sichtbar für deine Mutuals" : "Aus"}
          control={
            <Toggle checked={share} onChange={flipShare} />
          }
          hairline={false}
        />

        {/* Mutual-Filter */}
        <li className="px-4 py-3.5 hairline-top">
          <div className="flex items-center justify-between mb-2">
            <span className="t-body-l">Mutual-Filter</span>
            <span className="t-label-m text-ink-tertiary">
              ≥ {mutual} Freunde
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={mutual}
            onChange={(e) => setMutualValue(Number(e.target.value))}
            className="w-full accent-stamp"
          />
        </li>

        {/* Push-Notifications (collapsible) */}
        <li className="hairline-top">
          <button
            onClick={() => setPushOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <span className="t-body-l">Push-Benachrichtigungen</span>
            <ChevronDownIcon
              size={18}
              className={`text-ink-tertiary transition-transform ${
                pushOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {pushOpen && (
            <ul className="bg-sunken/40">
              {NOTIFICATION_LABELS.map((n) => (
                <li
                  key={n.key}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="t-body-m">{n.label}</span>
                  <Toggle
                    checked={prefs[n.key] ?? false}
                    onChange={() => flipPref(n.key)}
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </Card>
  );
}

function SettingRow({
  label,
  hint,
  control,
  hairline = true,
}: {
  label: string;
  hint?: string;
  control: React.ReactNode;
  hairline?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3.5 ${
        hairline ? "hairline-top" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="t-body-l">{label}</div>
        {hint && (
          <div className="t-body-s text-ink-tertiary mt-0.5">{hint}</div>
        )}
      </div>
      {control}
    </li>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
        checked ? "bg-stamp" : "bg-ink-tertiary/30"
      }`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
