import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Polaroid } from "@/components/ui/Polaroid";
import { Stamp } from "@/components/ui/Stamp";
import {
  ChatIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
} from "@/components/icons";
import { getPersonProfile } from "@/lib/data";

export default async function PersonProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPersonProfile(id);
  if (!person) notFound();

  return (
    <>
      <TopBar
        title=""
        showBell={false}
        leading={
          <Link
            href="/"
            aria-label="Zurück"
            className="t-label-l text-postage -ml-1"
          >
            ← Orbit
          </Link>
        }
      />

      <div className="px-4 pb-28 space-y-6">
        <section className="flex flex-col items-center pt-4">
          <Polaroid
            caption={person.isFriend ? `seit ${person.since}` : "Mutual"}
            rotation={-2}
            className="w-[180px]"
          >
            <span
              className="t-display-xl text-ink-secondary"
              style={{ fontSize: 64 }}
            >
              {person.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
          </Polaroid>
          <h1 className="t-display-l mt-5">{person.name}</h1>
          <div className="inline-flex items-center gap-1.5 mt-1 t-body-m text-ink-secondary">
            <MapPinIcon size={14} /> {person.city}
          </div>
          {person.isFriend ? (
            <div className="mt-3">
              <Stamp rotation={3}>Im Orbit</Stamp>
            </div>
          ) : (
            <div className="mt-2 t-body-s text-ink-secondary">
              {person.mutualsCount} gemeinsame Freunde
            </div>
          )}
        </section>

        <Card className="p-0 overflow-hidden">
          <ActionRow
            icon={<EnvelopeIcon size={18} />}
            label="Meetup anfragen"
            tone="primary"
            href="/meetup/new"
          />
          {person.isFriend && (
            <>
              <ActionRow
                icon={<ChatIcon size={18} />}
                label="WhatsApp öffnen"
                hairline
              />
              <ActionRow
                icon={<PhoneIcon size={18} />}
                label="Anrufen"
                hairline
              />
            </>
          )}
        </Card>

        {!person.isFriend && (
          <Button variant="secondary" block>
            Als Kontakt hinzufügen
          </Button>
        )}
      </div>
    </>
  );
}

function ActionRow({
  icon,
  label,
  hairline,
  tone = "default",
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  hairline?: boolean;
  tone?: "primary" | "default";
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-4 ${
        hairline ? "hairline-top" : ""
      } active:bg-sunken transition-colors`}
    >
      <span
        className={`w-8 h-8 inline-flex items-center justify-center rounded-full ${
          tone === "primary"
            ? "bg-stamp/15 text-stamp"
            : "bg-surface-accent text-ink-secondary"
        }`}
      >
        {icon}
      </span>
      <span className="t-label-l flex-1">{label}</span>
      <ChevronRightIcon size={18} className="text-ink-tertiary" />
    </Link>
  );
}
