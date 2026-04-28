import { Suspense } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { TopBarWithUnread } from "@/components/shell/TopBarWithUnread";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrbitLogo } from "@/components/OrbitLogo";
import { MapPinIcon, ShareIcon } from "@/components/icons";
import { getOrbitHomeData } from "@/lib/data";
import { OrbitSubtabs } from "./_components/OrbitSubtabs";
import { FriendsCitiesMap } from "./_components/FriendsCitiesMap";

const orbitLogo = (
  <OrbitLogo size={32} className="text-ink-primary -ml-1" />
);

export default function CurrentOrbitPage() {
  return (
    <>
      <Suspense
        fallback={
          <TopBar title="Current Orbit" large unread={0} leading={orbitLogo} />
        }
      >
        <TopBarWithUnread title="Current Orbit" large leading={orbitLogo} />
      </Suspense>

      <Suspense fallback={<HomeBodySkeleton />}>
        <HomeBody />
      </Suspense>
    </>
  );
}

async function HomeBody() {
  const orbit = await getOrbitHomeData();

  return (
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

      <FriendsCitiesMap data={orbit.citiesMap} />

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
  );
}

function HomeBodySkeleton() {
  return (
    <div className="px-4 pb-28 space-y-6">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-40 w-full rounded-[var(--radius-l)]" />
      <Skeleton className="h-32 w-full rounded-[var(--radius-l)]" />
      <Card>
        <Skeleton className="h-5 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full" />
      </Card>
    </div>
  );
}
