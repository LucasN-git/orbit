import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Stamp } from "@/components/ui/Stamp";
import { Avatar } from "@/components/ui/Avatar";
import { PlaneIcon } from "@/components/icons";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";
import { fullName, toneFor } from "@/lib/data-helpers";
import { DeleteTripBtn } from "./DeleteTripBtn";

type Params = Promise<{ id: string }>;

export default async function TripDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const me = await requireUserId();
  const sb = admin();

  const { data: tripRaw } = await sb
    .from("trips")
    .select(
      "id, user_id, orbit_id, start_date, end_date, reason, parent_trip_id, orbit:orbits(name, country_code), owner:users!trips_user_id_fkey(first_name, last_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!tripRaw) notFound();
  const trip = tripRaw as {
    id: string;
    user_id: string;
    orbit_id: string;
    start_date: string;
    end_date: string;
    reason: string | null;
    parent_trip_id: string | null;
    orbit: { name: string; country_code: string | null } | null;
    owner: { first_name: string | null; last_name: string | null } | null;
  };
  const isOwner = trip.user_id === me;

  // Mutuals identifizieren
  const { data: links } = await sb
    .from("friend_links")
    .select("user_a, user_b")
    .eq("status", "mutual")
    .or(`user_a.eq.${me},user_b.eq.${me}`);
  const mutualIds = ((links ?? []) as { user_a: string; user_b: string }[])
    .map((l) => (l.user_a === me ? l.user_b : l.user_a));

  // Overlapping Trips von Mutuals
  type OverlapRow = {
    user_id: string;
    start_date: string;
    end_date: string;
    user: { first_name: string | null; last_name: string | null } | null;
  };
  const { data: overlapsRaw } = await sb
    .from("trips")
    .select(
      "user_id, start_date, end_date, user:users!trips_user_id_fkey(first_name, last_name)",
    )
    .eq("orbit_id", trip.orbit_id)
    .lte("start_date", trip.end_date)
    .gte("end_date", trip.start_date)
    .neq("user_id", me);
  const overlaps = ((overlapsRaw ?? []) as OverlapRow[]).filter((o) =>
    mutualIds.includes(o.user_id),
  );

  // Co-Traveler
  const { data: coRaw } = await sb
    .from("trip_participants")
    .select("user:users(id, first_name, last_name)")
    .eq("trip_id", id);
  type CoRow = {
    user: { id: string; first_name: string | null; last_name: string | null } | null;
  };
  const coTravelers = ((coRaw ?? []) as CoRow[])
    .map((r) => r.user)
    .filter((u): u is NonNullable<CoRow["user"]> => !!u);

  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  const fmt = (d: Date) =>
    d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "long",
    });
  const days = Math.round((+end - +start) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <>
      <TopBar
        title=""
        showBell={false}
        leading={
          <Link
            href="/trips"
            aria-label="Zurück"
            className="t-label-l text-postage -ml-1"
          >
            ← Trips
          </Link>
        }
      />

      <div className="px-4 pb-28 space-y-6">
        <Card variant="postcard" className="overflow-hidden">
          <div className="absolute top-4 right-4">
            <Stamp rotation={6}>
              <PlaneIcon size={12} />
              {(trip.orbit?.country_code ?? "TRIP").toUpperCase()}
            </Stamp>
          </div>

          <div className="t-mono text-ink-tertiary mb-2">
            {fmt(start)} → {fmt(end)} · {days} Tage
          </div>
          <h1 className="t-display-l text-ink-primary leading-tight">
            {trip.orbit?.name ?? "—"}
          </h1>

          {trip.reason && (
            <div className="mt-3 t-body-m italic-display text-ink-secondary">
              {trip.reason}
            </div>
          )}

          {!isOwner && trip.owner && (
            <div className="hairline-top mt-5 pt-4 t-body-s text-ink-secondary">
              Geplant von{" "}
              <strong className="text-ink-primary">
                {fullName(trip.owner)}
              </strong>
            </div>
          )}
        </Card>

        <section>
          <h2 className="t-display-s text-ink-primary mb-2 px-1">
            Wer ist auch da?
          </h2>
          <Card>
            {overlaps.length === 0 ? (
              <p className="t-body-m text-ink-secondary">
                Niemand aus deinem Orbit ist zur gleichen Zeit dort —
                vielleicht jemanden einladen?
              </p>
            ) : (
              <ul className="space-y-3">
                {overlaps.map((o) => (
                  <li
                    key={o.user_id}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      name={fullName(o.user ?? {})}
                      tone={toneFor(o.user_id)}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="t-body-l text-ink-primary">
                        {fullName(o.user ?? {})}
                      </div>
                      <div className="t-mono text-ink-tertiary mt-0.5">
                        {fmt(new Date(o.start_date))} →{" "}
                        {fmt(new Date(o.end_date))}
                      </div>
                    </div>
                    <Link
                      href={`/profile/${o.user_id}`}
                      className="t-label-m text-postage"
                    >
                      Profil
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {coTravelers.length > 0 && (
          <section>
            <h2 className="t-display-s text-ink-primary mb-2 px-1">
              Mitreisende
            </h2>
            <Card>
              <ul className="space-y-3">
                {coTravelers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <Avatar
                      name={fullName(u)}
                      tone={toneFor(u.id)}
                      size={36}
                    />
                    <span className="t-body-l">{fullName(u)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {isOwner && <DeleteTripBtn tripId={trip.id} />}
      </div>
    </>
  );
}
