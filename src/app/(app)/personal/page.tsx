import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Polaroid } from "@/components/ui/Polaroid";
import { ChevronRightIcon, MapPinIcon, ShareIcon } from "@/components/icons";
import {
  getPersonalSpaceData,
  getUnreadNotificationCount,
} from "@/lib/data";
import { SettingsPanel } from "./SettingsPanel";
import { LocationRefreshBtn } from "./LocationRefreshBtn";
import { LogoutBtn } from "./LogoutBtn";

export default async function PersonalPage() {
  const [data, unread] = await Promise.all([
    getPersonalSpaceData(),
    getUnreadNotificationCount(),
  ]);
  const { user, settings, location } = data.me;
  const orbitName =
    (location?.orbit as { name: string } | null)?.name ?? "—";

  return (
    <>
      <TopBar title="Profil" large unread={unread} />

      <div className="px-4 pb-28 space-y-6">
        <section className="flex items-center gap-5">
          <Polaroid
            caption={
              location?.last_seen_at
                ? `seit ${new Date(location.last_seen_at).toLocaleDateString(
                    "de-DE",
                    { day: "2-digit", month: "2-digit" },
                  )}`
                : "—"
            }
            rotation={-3}
            className="w-[96px] shrink-0"
          >
            <span className="t-display-l text-ink-secondary">
              {(user.first_name ?? "?")[0]}
              {(user.last_name ?? "")[0] ?? ""}
            </span>
          </Polaroid>
          <div className="min-w-0">
            <div className="t-display-l text-ink-primary leading-tight">
              {user.first_name ?? ""} {user.last_name ?? ""}
            </div>
            <div className="t-body-m text-ink-secondary truncate">
              {user.email ?? "—"}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 t-body-s text-ink-secondary">
              <MapPinIcon size={14} /> {orbitName}
            </div>
            <div className="mt-2">
              <LocationRefreshBtn />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Kontakte">
            <Link
              href="/contacts"
              className="t-label-m text-postage"
            >
              Verwalten →
            </Link>
          </SectionHeader>
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <div className="t-label-l">
                  {data.contactsOnOrbit} von {data.contactsTotal} sind auf
                  Orbit
                </div>
                <div className="t-body-s text-ink-secondary mt-0.5">
                  {data.friends.length} Freundschaften
                </div>
              </div>
              <Link
                href="/contacts"
                className="t-label-m text-postage inline-flex items-center gap-1"
                aria-label="Kontakte einladen"
              >
                <ShareIcon size={16} /> Einladen
              </Link>
            </div>
            {data.friends.length > 0 && (
              <div className="hairline-top pt-3 flex -space-x-2">
                {data.friends.slice(0, 5).map((p) => (
                  <Avatar
                    key={p.id}
                    name={p.name}
                    tone={p.tone}
                    size={32}
                  />
                ))}
                {data.friends.length > 5 && (
                  <span className="ml-3 t-body-s text-ink-secondary self-center">
                    +{data.friends.length - 5}
                  </span>
                )}
              </div>
            )}
          </Card>
        </section>

        <section>
          <SectionHeader title="Mein Orbit" />
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <MapPinIcon size={18} className="text-ink-secondary" />
              <span className="t-body-l flex-1">{orbitName}</span>
              <span className="t-body-s text-ink-tertiary">Aktuell</span>
            </div>
          </Card>
        </section>

        <section>
          <SectionHeader title="Einstellungen" />
          <SettingsPanel
            shareLocation={settings?.share_location ?? true}
            mutualMin={settings?.mutual_min_friends ?? 10}
            notificationPrefs={
              ((settings as never as {
                notification_prefs?: Record<string, boolean>;
              } | null)?.notification_prefs ?? {}) as Record<
                string,
                boolean
              >
            }
          />
        </section>

        <Card className="p-0 overflow-hidden">
          <ul>
            <DocLink label="AGB" href="/legal/agb" first />
            <DocLink label="Datenschutz" href="/legal/privacy" />
            <DocLink label="Impressum" href="/legal/imprint" />
          </ul>
        </Card>

        <LogoutBtn />
      </div>
    </>
  );
}

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-2 px-1">
      <h2 className="t-display-s text-ink-primary">{title}</h2>
      {children}
    </div>
  );
}

function DocLink({
  label,
  href,
  first = false,
}: {
  label: string;
  href: string;
  first?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3.5 ${
          first ? "" : "hairline-top"
        }`}
      >
        <span className="t-body-l flex-1">{label}</span>
        <ChevronRightIcon size={18} className="text-ink-tertiary" />
      </Link>
    </li>
  );
}
