import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";
import { Avatar } from "@/components/ui/Avatar";
import { PlaneIcon, PlusIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getTrips,
  getUnreadNotificationCount,
  type TripCardData,
} from "@/lib/data";

export default async function TripsPage() {
  const [trips, unread] = await Promise.all([
    getTrips(),
    getUnreadNotificationCount(),
  ]);

  return (
    <>
      <TopBar
        title="Trips"
        large
        unread={unread}
        trailing={
          <Link
            href="/trip/new"
            aria-label="Trip planen"
            className="w-10 h-10 inline-flex items-center justify-center text-ink-primary"
          >
            <PlusIcon size={22} />
          </Link>
        }
      />

      <div className="px-4 pb-28 space-y-5">
        {trips.length === 0 ? (
          <EmptyState
            icon={<PlaneIcon size={32} />}
            title="Keine Reisen geplant."
            body="Trag deinen nächsten Trip ein, damit andere wissen, wo du bist."
            cta={
              <Link href="/trip/new">
                <Button variant="primary">
                  <PlusIcon size={18} /> Trip planen
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <p className="t-body-m text-ink-secondary">
              Geplante Aufenthalte in anderen Städten — hier siehst du, wer
              von deinen Leuten zur gleichen Zeit dort ist.
            </p>

            <ul className="space-y-4">
              {trips.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/trip/${t.id}`}
                    className="block active:scale-[0.99] transition-transform"
                  >
                    <TripCard trip={t} />
                  </Link>
                </li>
              ))}
            </ul>

            <Link href="/trip/new">
              <Button variant="secondary" block>
                <PlusIcon size={18} />
                Neuen Trip planen
              </Button>
            </Link>
          </>
        )}
      </div>
    </>
  );
}

function TripCard({ trip }: { trip: TripCardData }) {
  const start = new Date(trip.start);
  const end = new Date(trip.end);
  const fmt = (d: Date) =>
    d.toLocaleString("de-DE", { day: "2-digit", month: "short" });
  const days = Math.round((+end - +start) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Card variant="postcard" className="overflow-hidden">
      <div className="absolute top-4 right-4">
        <Stamp rotation={6}>
          <PlaneIcon size={12} />
          {(trip.countryCode ?? trip.country.slice(0, 3)).toUpperCase()}
        </Stamp>
      </div>

      <div className="t-mono text-ink-tertiary mb-2">
        {fmt(start)} → {fmt(end)} · {days} Tage
      </div>
      <div className="t-display-l text-ink-primary leading-tight">
        {trip.city}
      </div>
      <div className="t-body-m text-ink-secondary mt-1">{trip.country}</div>

      {trip.reason && (
        <div className="mt-3 t-body-s italic-display text-ink-secondary">
          {trip.reason}
        </div>
      )}

      <div className="hairline-top mt-5 pt-4">
        {trip.overlaps.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {trip.overlaps.map((p) => (
                <Avatar key={p} name={p} size={32} tone="postage" />
              ))}
            </div>
            <div className="t-body-m text-ink-primary">
              <strong className="t-label-l">
                {trip.overlaps.join(", ")}
              </strong>{" "}
              {trip.overlaps.length === 1 ? "ist" : "sind"} auch da.
            </div>
          </div>
        ) : (
          <div className="t-body-m text-ink-secondary">
            Niemand aus deinem Orbit ist hier — vielleicht jemanden
            einladen?
          </div>
        )}
      </div>
    </Card>
  );
}
