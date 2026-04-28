"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { CloseIcon, PlusIcon } from "@/components/icons";
import type { Tone } from "@/lib/data-helpers";
import { createTrip } from "./actions";

export type OrbitOption = {
  id: string;
  name: string;
  type: "city" | "country" | "region";
  country_code: string | null;
};

export type Mutual = { id: string; name: string; tone: Tone };

type OptionalKey = "reason" | "participants";
const optionalLabels: Record<OptionalKey, string> = {
  reason: "Grund der Reise",
  participants: "Mitreisende",
};

export function TripForm({
  orbits,
  mutuals,
}: {
  orbits: OrbitOption[];
  mutuals: Mutual[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [orbitId, setOrbitId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState<Set<OptionalKey>>(new Set());

  const remaining = (Object.keys(optionalLabels) as OptionalKey[]).filter(
    (k) => !shown.has(k),
  );

  function toggleParticipant(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createTrip({
        orbitId,
        startDate,
        endDate,
        reason: shown.has("reason") ? reason || null : null,
        participantIds: shown.has("participants")
          ? Array.from(selected)
          : [],
      });
      if (!res.ok) setError(res.error);
      else router.push(`/trip/${res.id}`);
    });
  }

  const canSubmit =
    !!orbitId && !!startDate && !!endDate && !pending;

  return (
    <PhoneFrame>
      <TopBar
        title="Neuer Trip"
        showBell={false}
        leading={
          <Link
            href="/trips"
            aria-label="Schließen"
            className="w-10 h-10 -ml-2 inline-flex items-center justify-center text-ink-primary"
          >
            <CloseIcon size={22} />
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-4">
        <p className="t-body-m text-ink-secondary">
          Sag uns wann und wo — wir checken automatisch, wer von deinen
          Leuten zur gleichen Zeit dort ist.
        </p>

        <label className="block">
          <span className="t-label-m text-ink-secondary block mb-2">
            Wohin?
          </span>
          <select
            value={orbitId}
            onChange={(e) => setOrbitId(e.target.value)}
            className="w-full h-12 px-3 rounded-[var(--radius-m)] bg-sunken hairline t-body-l outline-none focus:bg-raised focus:border-postage focus:border-[1.5px]"
          >
            <option value="">Stadt oder Land wählen …</option>
            {groupOrbits(orbits).map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Von"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Bis"
            type="date"
            required
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {shown.has("reason") && (
          <Input
            label="Grund"
            placeholder="z.B. Familienurlaub, Konferenz"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        {shown.has("participants") && (
          <div>
            <span className="t-label-m text-ink-secondary block mb-2">
              Mitreisende · {selected.size} ausgewählt
            </span>
            {mutuals.length === 0 ? (
              <div className="t-body-s text-ink-tertiary">
                Du hast noch keine Mutuals.
              </div>
            ) : (
              <ul className="space-y-2">
                {mutuals.map((m) => {
                  const isSelected = selected.has(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggleParticipant(m.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-[var(--radius-m)] transition-colors ${
                          isSelected
                            ? "bg-surface-accent"
                            : "hover:bg-sunken"
                        }`}
                      >
                        <Avatar name={m.name} tone={m.tone} size={36} />
                        <span className="t-body-l flex-1 text-left">
                          {m.name}
                        </span>
                        <span
                          className={`w-5 h-5 rounded-full border-2 ${
                            isSelected
                              ? "bg-stamp border-stamp"
                              : "border-ink-tertiary/40"
                          } inline-flex items-center justify-center`}
                        >
                          {isSelected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6.5l3 3 5-7"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {remaining.length > 0 && (
          <div className="pt-2">
            <div className="t-label-s text-ink-tertiary mb-2">
              Mehr Felder
            </div>
            <div className="flex flex-wrap gap-2">
              {remaining.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setShown((s) => new Set(s).add(k))}
                  className="t-label-m h-9 px-3 rounded-[var(--radius-m)] bg-sunken hairline text-ink-secondary inline-flex items-center gap-1.5"
                >
                  <PlusIcon size={14} />
                  {optionalLabels[k]}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="t-body-s text-error">{error}</div>}
      </div>

      <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] bg-canvas hairline-top">
        <Button block disabled={!canSubmit} onClick={submit}>
          {pending ? "Wird gespeichert …" : "Trip speichern"}
        </Button>
      </div>
    </PhoneFrame>
  );
}

function groupOrbits(orbits: OrbitOption[]) {
  const cities = orbits.filter((o) => o.type === "city");
  const regions = orbits.filter((o) => o.type === "region");
  const countries = orbits.filter((o) => o.type === "country");
  return [
    { label: "Städte", items: cities },
    { label: "Regionen", items: regions },
    { label: "Länder", items: countries },
  ].filter((g) => g.items.length > 0);
}
