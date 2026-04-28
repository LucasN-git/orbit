"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { CloseIcon, PlusIcon } from "@/components/icons";
import type { Tone } from "@/lib/data-helpers";
import { createMeetup } from "./actions";

const meetupCategories = [
  "Café",
  "Restaurant",
  "Sport",
  "Drinks",
  "Spaziergang",
  "Kino",
  "Sonstiges",
];

type OptionalKey =
  | "time"
  | "location"
  | "category"
  | "description";

const optionalLabels: Record<OptionalKey, string> = {
  time: "Uhrzeit",
  location: "Location",
  category: "Kategorie",
  description: "Beschreibung",
};

export type Mutual = { id: string; name: string; tone: Tone };

export type Prefill = {
  title: string;
  time: string | null;
  location: string | null;
  category: string | null;
  description: string | null;
  participantIds: string[];
};

export function MeetupForm({
  prefill,
  mutuals,
}: {
  prefill: Prefill | null;
  mutuals: Mutual[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(prefill?.title ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(prefill?.time ?? "");
  const [location, setLocation] = useState(prefill?.location ?? "");
  const [category, setCategory] = useState<string | null>(
    prefill?.category ?? null,
  );
  const [description, setDescription] = useState(
    prefill?.description ?? "",
  );
  const [selected, setSelected] = useState<Set<string>>(
    new Set(prefill?.participantIds ?? []),
  );

  // Wenn Prefill da ist, optional-Felder direkt anzeigen
  const initialShown = new Set<OptionalKey>();
  if (prefill?.time) initialShown.add("time");
  if (prefill?.location) initialShown.add("location");
  if (prefill?.category) initialShown.add("category");
  if (prefill?.description) initialShown.add("description");
  const [shown, setShown] = useState<Set<OptionalKey>>(initialShown);

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createMeetup({
        title,
        date,
        time: shown.has("time") ? time || null : null,
        location: shown.has("location") ? location || null : null,
        category: shown.has("category") ? category : null,
        description: shown.has("description") ? description || null : null,
        participantIds: Array.from(selected),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/meetup/${res.id}`);
    });
  }

  const canSubmit = title.trim().length > 0 && date.length > 0 && !pending;

  return (
    <PhoneFrame>
      <TopBar
        title={prefill ? "Neuer Vorschlag" : "Neues Meetup"}
        showBell={false}
        leading={
          <Link
            href="/"
            aria-label="Schließen"
            className="w-10 h-10 -ml-2 inline-flex items-center justify-center text-ink-primary"
          >
            <CloseIcon size={22} />
          </Link>
        }
      />

      <form
        onSubmit={submit}
        className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-4"
      >
        {prefill && (
          <div className="t-body-s text-ink-secondary italic-display">
            Wir haben Titel und Details aus dem alten Meetup übernommen —
            wähl ein neues Datum.
          </div>
        )}

        <p className="t-body-m text-ink-secondary">
          Schick eine Einladung raus — Titel und Datum reichen, alles andere
          ist optional.
        </p>

        <Input
          label="Worum geht's?"
          placeholder="z.B. Kaffee bei Marta"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Datum"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {shown.has("time") && (
          <Input
            label="Uhrzeit"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        )}

        {shown.has("location") && (
          <Input
            label="Location"
            placeholder="Café, Adresse, Ort …"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        )}

        {shown.has("category") && (
          <div>
            <span className="t-label-m text-ink-secondary block mb-2">
              Kategorie
            </span>
            <div className="flex flex-wrap gap-2">
              {meetupCategories.map((c) => (
                <Chip
                  key={c}
                  type="button"
                  active={category === c}
                  onClick={() =>
                    setCategory((prev) => (prev === c ? null : c))
                  }
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {shown.has("description") && (
          <label className="block">
            <span className="t-label-m text-ink-secondary block mb-2">
              Beschreibung
            </span>
            <textarea
              rows={3}
              placeholder="Optional — was wäre die Idee?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-[var(--radius-m)] bg-sunken hairline t-body-l outline-none focus:bg-raised focus:border-postage focus:border-[1.5px] placeholder:text-ink-tertiary resize-none"
            />
          </label>
        )}

        {/* Optional-Toggles */}
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

        {/* Teilnehmer */}
        <div className="pt-4 hairline-top">
          <div className="t-label-m text-ink-secondary mb-3">
            Wer kommt? · {selected.size} ausgewählt
          </div>
          {mutuals.length === 0 ? (
            <div className="t-body-s text-ink-tertiary">
              Du hast noch keine Mutuals — Kontakte syncen oder einladen.
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
                        isSelected ? "bg-surface-accent" : "hover:bg-sunken"
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

        {error && <div className="t-body-s text-error">{error}</div>}
      </form>

      <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] bg-canvas hairline-top">
        <Button block type="button" disabled={!canSubmit} onClick={submit}>
          {pending ? "Wird verschickt …" : "Einladung senden"}
        </Button>
      </div>
    </PhoneFrame>
  );
}
