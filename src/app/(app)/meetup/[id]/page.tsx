import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Stamp } from "@/components/ui/Stamp";
import { MapPinIcon } from "@/components/icons";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";
import { fullName, toneFor, type Tone } from "@/lib/data-helpers";
import { ResponseActions } from "./ResponseActions";
import type { ParticipantResponse } from "./ResponseActions";

type Params = Promise<{ id: string }>;

export default async function MeetupDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const me = await requireUserId();
  const sb = admin();

  const { data: meetupRaw } = await sb
    .from("meetups")
    .select(
      "id, creator_id, title, date, time, location, category, description, status, creator:users(first_name, last_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!meetupRaw) notFound();
  const meetup = meetupRaw as {
    id: string;
    creator_id: string;
    title: string;
    date: string;
    time: string | null;
    location: string | null;
    category: string | null;
    description: string | null;
    status: string;
    creator: { first_name: string | null; last_name: string | null } | null;
  };

  const { data: parts } = await sb
    .from("meetup_participants")
    .select(
      "id, participant_id, guest_name, response, response_message, user:users(first_name, last_name)",
    )
    .eq("meetup_id", id);

  type PartRow = {
    id: string;
    participant_id: string | null;
    guest_name: string | null;
    response: ParticipantResponse;
    response_message: string | null;
    user: { first_name: string | null; last_name: string | null } | null;
  };
  const participants = (parts ?? []) as PartRow[];

  const myRow = participants.find((p) => p.participant_id === me);
  const isCreator = meetup.creator_id === me;

  const date = new Date(meetup.date);
  const dateStr = date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <>
      <TopBar
        title=""
        showBell={false}
        leading={
          <Link
            href="/calendar"
            aria-label="Zurück"
            className="t-label-l text-postage -ml-1"
          >
            ← Kalender
          </Link>
        }
      />

      <div className="px-4 pb-28 space-y-6">
        <Card variant="postcard" className="overflow-hidden">
          <div className="absolute top-4 right-4">
            {meetup.status === "cancelled" ? (
              <Stamp rotation={-6}>ABGESAGT</Stamp>
            ) : (
              <Stamp rotation={-6}>
                {meetup.category?.toUpperCase() ?? "MEETUP"}
              </Stamp>
            )}
          </div>

          <div className="t-mono text-ink-tertiary mb-2 capitalize">
            {dateStr}
            {meetup.time && ` · ${meetup.time}`}
          </div>
          <h1 className="t-display-l text-ink-primary leading-tight">
            {meetup.title}
          </h1>

          {meetup.location && (
            <div className="flex items-center gap-2 mt-3 t-body-l text-ink-secondary">
              <MapPinIcon size={18} /> {meetup.location}
            </div>
          )}

          {meetup.description && (
            <p className="mt-4 t-body-m text-ink-secondary italic-display">
              {meetup.description}
            </p>
          )}

          <div className="hairline-top mt-5 pt-4 t-body-s text-ink-secondary">
            Eingeladen von{" "}
            <strong className="text-ink-primary">
              {fullName(meetup.creator ?? {})}
            </strong>
          </div>
        </Card>

        {/* Antwort-Aktionen für Teilnehmer */}
        {!isCreator && myRow && meetup.status !== "cancelled" && (
          <ResponseActions
            meetupId={meetup.id}
            currentResponse={myRow.response}
          />
        )}

        {/* Teilnehmer-Liste */}
        <section>
          <SectionHeader
            title={`Teilnehmer · ${participants.length + 1}`}
          />
          <Card className="p-0 overflow-hidden">
            <ul>
              <ParticipantRow
                name={fullName(meetup.creator ?? {})}
                response={null}
                isCreator
                tone={toneFor(meetup.creator_id)}
              />
              {participants.map((p) => (
                <ParticipantRow
                  key={p.id}
                  name={
                    p.guest_name ??
                    fullName(p.user ?? {}) ??
                    "Unbekannt"
                  }
                  response={p.response}
                  message={p.response_message}
                  hairline
                  tone={toneFor(p.participant_id ?? p.id)}
                />
              ))}
            </ul>
          </Card>
        </section>

        {isCreator && meetup.status !== "cancelled" && (
          <CreatorActions meetupId={meetup.id} />
        )}
      </div>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="t-display-s text-ink-primary mb-2 px-1">{title}</h2>
  );
}

function ParticipantRow({
  name,
  response,
  message,
  isCreator = false,
  hairline = false,
  tone,
}: {
  name: string;
  response: ParticipantResponse | null;
  message?: string | null;
  isCreator?: boolean;
  hairline?: boolean;
  tone: Tone;
}) {
  return (
    <li
      className={`flex items-start gap-3 px-4 py-3.5 ${
        hairline ? "hairline-top" : ""
      }`}
    >
      <Avatar name={name} tone={tone} size={36} />
      <div className="flex-1 min-w-0">
        <div className="t-body-l text-ink-primary truncate">
          {name}
          {isCreator && (
            <span className="t-label-s text-ink-tertiary ml-2">
              · LADET EIN
            </span>
          )}
        </div>
        {message && (
          <div className="t-body-s text-ink-secondary italic-display mt-0.5">
            „{message}"
          </div>
        )}
      </div>
      {response && (
        <ResponseBadge response={response} />
      )}
    </li>
  );
}

function ResponseBadge({ response }: { response: ParticipantResponse }) {
  const map: Record<ParticipantResponse, { label: string; tone: string }> = {
    accepted: { label: "zugesagt", tone: "text-postage" },
    declined: { label: "abgesagt", tone: "text-error" },
    reschedule: { label: "neuer Termin?", tone: "text-warning" },
    pending: { label: "offen", tone: "text-ink-tertiary" },
  };
  const info = map[response];
  return <span className={`t-label-s ${info.tone}`}>{info.label}</span>;
}

import { CancelMeetupBtn } from "./CancelMeetupBtn";

function CreatorActions({ meetupId }: { meetupId: string }) {
  return (
    <div className="space-y-2">
      <CancelMeetupBtn meetupId={meetupId} />
    </div>
  );
}
