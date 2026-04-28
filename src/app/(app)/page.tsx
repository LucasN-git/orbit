import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";
import { OrbitLogo } from "@/components/OrbitLogo";
import { MapPinIcon, ShareIcon } from "@/components/icons";
import {
  getCurrentOrbit,
  getFriendsCitiesMap,
  getUnreadNotificationCount,
} from "@/lib/data";
import { OrbitSubtabs } from "./_components/OrbitSubtabs";
import { FriendsCitiesMap } from "./_components/FriendsCitiesMap";

export default async function CurrentOrbitPage() {
  const [orbit, citiesMap, unread] = await Promise.all([
    getCurrentOrbit(),
    getFriendsCitiesMap(),
    getUnreadNotificationCount(),
  ]);

  return (
    <>
      <TopBar
        title="Current Orbit"
        large
        unread={unread}
        leading={
          <OrbitLogo
            size={32}
            className="text-ink-primary -ml-1"
          />
        }
      />

      <div className="px-4 pb-28 space-y-6">
        <section className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-ink-secondary">
            <MapPinIcon size={18} />
            <span className="t-body-l text-ink-primary">
              {orbit.city ?? "Standort fehlt"}
            </span>
            {orbit.city && (
              <span className="t-mono text-ink-tertiary ml-1">
                · seit {orbit.since}
              </span>
            )}
          </div>
          {orbit.city && <Stamp rotation={-6}>HIER</Stamp>}
        </section>

        <FriendsCitiesMap data={citiesMap} />

        <OrbitSubtabs
          friends={orbit.friends}
          mutuals={orbit.mutuals}
          mutualUnlock={orbit.mutualUnlock}
        />

        <Card className="flex items-center gap-3">
          <div className="flex-1">
            <div className="t-display-s text-ink-primary mb-1">
              {orbit.contactsOnOrbit} von {orbit.contactsTotal} Kontakten
            </div>
            <div className="t-body-m text-ink-secondary">
              {orbit.contactsTotal === 0
                ? "Sync deine Kontakte, dann sehen wir wer auf Orbit ist."
                : "sind schon auf Orbit. Lade die anderen ein, dann wird's hier voll."}
            </div>
          </div>
          <Button variant="secondary" className="shrink-0 px-4">
            <ShareIcon size={18} />
            Einladen
          </Button>
        </Card>
      </div>
    </>
  );
}
