"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import {
  CalendarIcon,
  GridIcon,
  ListIcon,
  MapPinIcon,
} from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CalendarMeetup } from "@/lib/data";

export function CalendarToggle({ meetups }: { meetups: CalendarMeetup[] }) {
  const [view, setView] = useState<"month" | "list">("list");

  return (
    <>
      <div className="inline-flex p-1 rounded-full bg-sunken hairline">
        <ToggleBtn
          active={view === "list"}
          onClick={() => setView("list")}
        >
          <ListIcon size={16} /> Liste
        </ToggleBtn>
        <ToggleBtn
          active={view === "month"}
          onClick={() => setView("month")}
        >
          <GridIcon size={16} /> Monat
        </ToggleBtn>
      </div>

      {meetups.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={32} />}
          title="Kein Termin im Kalender."
          body="Plane einen Meetup oder warte auf Anfragen."
        />
      ) : view === "list" ? (
        <MeetupList meetups={meetups} />
      ) : (
        <MonthGrid meetups={meetups} />
      )}
    </>
  );
}

function ToggleBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`t-label-m h-9 px-4 rounded-full inline-flex items-center gap-2 transition-colors ${
        active
          ? "bg-canvas text-ink-primary shadow-[var(--shadow-card)]"
          : "text-ink-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function MeetupList({ meetups }: { meetups: CalendarMeetup[] }) {
  return (
    <ul className="space-y-3">
      {meetups.map((m) => {
        const d = new Date(m.date);
        const day = d.getDate().toString().padStart(2, "0");
        const month = d.toLocaleString("de-DE", { month: "short" });
        const weekday = d.toLocaleString("de-DE", { weekday: "long" });
        return (
          <li key={m.id}>
            <Link
              href={`/meetup/${m.id}`}
              className="block active:scale-[0.99] transition-transform"
            >
              <Card className="flex gap-4">
                <div className="shrink-0 w-14 text-center">
                  <div className="t-label-s text-ink-secondary">
                    {month.toUpperCase()}
                  </div>
                  <div className="t-display-l text-ink-primary leading-none mt-1">
                    {day}
                  </div>
                  <div className="t-body-s text-ink-tertiary mt-1">
                    {weekday.slice(0, 3)}.
                  </div>
                </div>
                <div className="flex-1 min-w-0 border-l border-hairline/40 pl-4">
                  <div className="t-display-s text-ink-primary">
                    {m.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 t-body-s text-ink-secondary">
                    {m.time && <span className="t-mono">{m.time}</span>}
                    {m.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon size={14} /> {m.location}
                      </span>
                    )}
                  </div>
                  {m.participants.length > 0 && (
                    <div className="flex -space-x-2 mt-3">
                      {m.participants.slice(0, 4).map((p) => (
                        <Avatar
                          key={p}
                          name={p}
                          size={28}
                          tone="postage"
                        />
                      ))}
                      {m.participants.length > 4 && (
                        <span className="t-body-s text-ink-tertiary ml-3 self-center">
                          +{m.participants.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MonthGrid({ meetups }: { meetups: CalendarMeetup[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const meetupDays = new Set(
    meetups
      .map((m) => new Date(m.date))
      .filter((d) => d.getMonth() === month && d.getFullYear() === year)
      .map((d) => d.getDate()),
  );

  const todayN =
    today.getMonth() === month && today.getFullYear() === year
      ? today.getDate()
      : -1;

  return (
    <Card>
      <div className="t-display-s mb-4 capitalize">
        {firstDay.toLocaleString("de-DE", { month: "long" })} {year}
      </div>
      <div className="grid grid-cols-7 gap-y-2 mb-2">
        {["M", "D", "M", "D", "F", "S", "S"].map((d, i) => (
          <div key={i} className="t-label-s text-ink-tertiary text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2">
        {cells.map((c, i) => (
          <div
            key={i}
            className="aspect-square flex items-center justify-center"
          >
            {c && (
              <div className="relative">
                <span
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-full t-body-l ${
                    c === todayN
                      ? "bg-stamp text-canvas"
                      : "text-ink-primary"
                  }`}
                >
                  {c}
                </span>
                {meetupDays.has(c) && c !== todayN && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-postage" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
