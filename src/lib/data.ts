import "server-only";
import { unstable_cache } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";
import { fullName, toneFor, type Tone } from "@/lib/data-helpers";
import { TAGS } from "@/lib/cache-tags";

export { toneFor, type Tone };

/**
 * Server-only Data-Access-Layer. Identität kommt aus der Auth-Session
 * (`requireUserId()`); Queries laufen weiter über den Service-Role-Client
 * mit manuellem User-Filter. Sobald RLS-Policies stehen, ersetzen wir
 * admin() durch den session-basierten Client und das Filtern fällt weg.
 *
 * Cache-Strategie:
 * - Cross-Request via `unstable_cache` mit Domain-Tags (cache-tags.ts).
 *   Server-Actions invalidieren via revalidateTag(...); TTL ist Backstop.
 * - keyParts enthalten die userId — Cache pro User getrennt. Tags sind
 *   userübergreifend, ein revalidateTag invalidiert global pro Domain.
 */
const TTL_SHORT = 30;
const TTL_MEDIUM = 60;
const TTL_LONG = 300;

function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}

// ── Helpers ────────────────────────────────────────────────────────────

const _fetchMutualIds = unstable_cache(
  async (meId: string): Promise<string[]> => {
    const { data, error } = await admin()
      .from("friend_links")
      .select("user_a, user_b")
      .eq("status", "mutual")
      .or(`user_a.eq.${meId},user_b.eq.${meId}`);
    if (error) throw error;
    return ((data ?? []) as { user_a: string; user_b: string }[]).map((r) =>
      r.user_a === meId ? r.user_b : r.user_a,
    );
  },
  ["mutual-ids"],
  { revalidate: TTL_LONG, tags: [TAGS.friends] },
);

// ── Types ──────────────────────────────────────────────────────────────

export type FriendInOrbit = {
  id: string;
  name: string;
  city: string;
  since: string;
  tone: Tone;
};

export type Mutual = {
  id: string;
  name: string;
  city: string;
  mutuals: number;
  tone: Tone;
};

export type CalendarMeetup = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  participants: string[];
};

export type TripCardData = {
  id: string;
  city: string;
  country: string;
  countryCode: string | null;
  start: string;
  end: string;
  reason: string | null;
  overlaps: string[];
};

export type NotificationItem = {
  id: string;
  type:
    | "invite"
    | "reschedule"
    | "new_in_orbit"
    | "new_signup"
    | "trip_overlap";
  title: string;
  body: string;
  when: string;
  unread: boolean;
  href: string;
};

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  username?: string | null;
  phone?: string | null;
  avatar_url: string | null;
  email_verified_at?: string | null;
  onboarding_completed_at?: string | null;
};

type LocationRow = {
  user_id: string;
  orbit_id: string;
  last_seen_at: string;
  orbit?: { id?: string; name: string; country_code?: string | null } | null;
  user?: UserRow | null;
};

// ── Me ─────────────────────────────────────────────────────────────────

export type Me = {
  user: UserRow & { username: string | null; phone: string | null };
  settings: {
    share_location: boolean;
    mutual_min_friends: number;
  } | null;
  location:
    | (LocationRow & { orbit: { name: string } | null })
    | null;
};

const _fetchMe = unstable_cache(
  async (me: string): Promise<Me> => {
    const sb = admin();
    const [user, settings, location] = await Promise.all([
      sb.from("users").select("*").eq("id", me).single(),
      sb.from("user_settings").select("*").eq("user_id", me).maybeSingle(),
      sb
        .from("user_locations")
        .select("*, orbit:orbits(id, slug, name, type)")
        .eq("user_id", me)
        .maybeSingle(),
    ]);
    if (user.error) throw user.error;
    return {
      user: user.data as Me["user"],
      settings: settings.data as Me["settings"],
      location: location.data as Me["location"],
    };
  },
  ["me"],
  { revalidate: TTL_MEDIUM, tags: [TAGS.user] },
);

export async function getMe(): Promise<Me> {
  const me = await requireUserId();
  return _fetchMe(me);
}

// ── Orbit Home (Current Orbit + Cities Map) ───────────────────────────

export type FriendCityCluster = {
  orbitId: string;
  city: string;
  countryCode: string | null;
  lat: number;
  lng: number;
  friends: { id: string; name: string; tone: Tone }[];
};

export type FriendsCitiesMap = {
  me: { lat: number; lng: number; city: string } | null;
  cities: FriendCityCluster[];
};

export type OrbitHomeData = {
  city: string | null;
  since: string;
  friends: FriendInOrbit[];
  mutuals: Mutual[];
  contactsTotal: number;
  contactsOnOrbit: number;
  mutualUnlock: { missing: number; threshold: number } | null;
  citiesMap: FriendsCitiesMap;
};

type OrbitCoords = {
  name: string;
  country_code: string | null;
  centroid_lat: number | null;
  centroid_lng: number | null;
};

type FriendLocRow = {
  user_id: string;
  orbit_id: string;
  last_seen_at: string;
  orbit: OrbitCoords | null;
  user: UserRow | null;
};

const _fetchOrbitHomeData = unstable_cache(
  async (me: string): Promise<OrbitHomeData> => {
    const sb = admin();

    // Parallel: meine Location, mutualIds, friend-Locations, Contacts-Counts,
    // Settings — alles, was die Home-Page braucht. Ein Query-Round-Trip-Tier.
    const mutualIds = await _fetchMutualIds(me);
    const [
      meLocRes,
      friendLocsRes,
      contactsTotalRes,
      contactsOnOrbitRes,
      settingsRes,
    ] = await Promise.all([
      sb
        .from("user_locations")
        .select(
          "orbit_id, last_seen_at, orbit:orbits(name, country_code, centroid_lat, centroid_lng)",
        )
        .eq("user_id", me)
        .maybeSingle(),
      mutualIds.length > 0
        ? sb
            .from("user_locations")
            .select(
              "user_id, orbit_id, last_seen_at, orbit:orbits(name, country_code, centroid_lat, centroid_lng), user:users(first_name, last_name)",
            )
            .in("user_id", mutualIds)
        : Promise.resolve({ data: [] as FriendLocRow[], error: null }),
      sb
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", me),
      sb
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", me)
        .not("matched_user_id", "is", null),
      sb
        .from("user_settings")
        .select("mutual_min_friends")
        .eq("user_id", me)
        .maybeSingle(),
    ]);

    const meRow = meLocRes.data as
      | {
          orbit_id: string;
          last_seen_at: string;
          orbit: OrbitCoords | null;
        }
      | null;
    const orbitId = meRow?.orbit_id;
    const friendLocs = (friendLocsRes.data ?? []) as FriendLocRow[];

    // Friends-In-Orbit aus dem gleichen friendLocs-Result clientseitig filtern.
    const friends: FriendInOrbit[] = orbitId
      ? friendLocs
          .filter((r) => r.orbit_id === orbitId)
          .map((r) => ({
            id: r.user_id,
            name: fullName(r.user ?? {}),
            city: r.orbit?.name ?? "",
            since: fmtDay(r.last_seen_at),
            tone: toneFor(r.user_id),
          }))
      : [];

    // Second-Hop für Mutuals — nur wenn jemand im selben Orbit ist.
    let mutuals: Mutual[] = [];
    if (orbitId && mutualIds.length > 0) {
      const orFilter = mutualIds
        .map((id) => `user_a.eq.${id},user_b.eq.${id}`)
        .join(",");
      const { data: secondHop, error: e2 } = await sb
        .from("friend_links")
        .select("user_a, user_b")
        .eq("status", "mutual")
        .or(orFilter);
      if (e2) throw e2;
      const counts = new Map<string, number>();
      for (const link of (secondHop ?? []) as {
        user_a: string;
        user_b: string;
      }[]) {
        for (const u of [link.user_a, link.user_b]) {
          if (u === me || mutualIds.includes(u)) continue;
          counts.set(u, (counts.get(u) ?? 0) + 1);
        }
      }
      if (counts.size > 0) {
        const candidateIds = Array.from(counts.keys());
        const { data: cand, error: e3 } = await sb
          .from("user_locations")
          .select(
            "user_id, orbit:orbits(name), user:users(first_name, last_name)",
          )
          .eq("orbit_id", orbitId)
          .in("user_id", candidateIds);
        if (e3) throw e3;
        mutuals = ((cand ?? []) as LocationRow[]).map((r) => ({
          id: r.user_id,
          name: fullName(r.user ?? {}),
          city: r.orbit?.name ?? "",
          mutuals: counts.get(r.user_id) ?? 0,
          tone: toneFor(r.user_id),
        }));
        mutuals.sort((a, b) => b.mutuals - a.mutuals);
      }
    }

    const contactsTotal = contactsTotalRes.count ?? 0;
    const contactsOnOrbit = contactsOnOrbitRes.count ?? 0;

    // Feature-Unlock-Indikator (PRD §6.7)
    const mutualThreshold =
      (settingsRes.data as { mutual_min_friends?: number } | null)
        ?.mutual_min_friends ?? 10;
    const mutualUnlock =
      contactsOnOrbit >= mutualThreshold
        ? null
        : {
            missing: mutualThreshold - contactsOnOrbit,
            threshold: mutualThreshold,
          };

    // Cities-Map aus demselben friendLocs-Result.
    const meCoords =
      meRow?.orbit &&
      meRow.orbit.centroid_lat != null &&
      meRow.orbit.centroid_lng != null
        ? {
            lat: Number(meRow.orbit.centroid_lat),
            lng: Number(meRow.orbit.centroid_lng),
            city: meRow.orbit.name,
          }
        : null;

    const clusters = new Map<string, FriendCityCluster>();
    for (const r of friendLocs) {
      if (
        !r.orbit ||
        r.orbit.centroid_lat == null ||
        r.orbit.centroid_lng == null
      ) {
        continue;
      }
      const existing = clusters.get(r.orbit_id);
      const friend = {
        id: r.user_id,
        name: fullName(r.user ?? {}),
        tone: toneFor(r.user_id),
      };
      if (existing) {
        existing.friends.push(friend);
      } else {
        clusters.set(r.orbit_id, {
          orbitId: r.orbit_id,
          city: r.orbit.name,
          countryCode: r.orbit.country_code,
          lat: Number(r.orbit.centroid_lat),
          lng: Number(r.orbit.centroid_lng),
          friends: [friend],
        });
      }
    }

    return {
      city: meRow?.orbit?.name ?? null,
      since: meRow ? fmtDay(meRow.last_seen_at) : "—",
      friends,
      mutuals,
      contactsTotal,
      contactsOnOrbit,
      mutualUnlock,
      citiesMap: {
        me: meCoords,
        cities: Array.from(clusters.values()).sort(
          (a, b) => b.friends.length - a.friends.length,
        ),
      },
    };
  },
  ["orbit-home-data"],
  {
    revalidate: TTL_MEDIUM,
    tags: [TAGS.orbit, TAGS.friends, TAGS.contacts],
  },
);

export async function getOrbitHomeData(): Promise<OrbitHomeData> {
  const me = await requireUserId();
  return _fetchOrbitHomeData(me);
}

// ── Calendar / Meetups ─────────────────────────────────────────────────

const _fetchUpcomingMeetups = unstable_cache(
  async (me: string): Promise<CalendarMeetup[]> => {
    const sb = admin();
    const today = new Date().toISOString().slice(0, 10);

  const { data: created, error: e1 } = await sb
    .from("meetups")
    .select("id, title, date, time, location, status")
    .eq("creator_id", me)
    .gte("date", today)
    .neq("status", "cancelled");
  if (e1) throw e1;

  const { data: parts, error: e2 } = await sb
    .from("meetup_participants")
    .select("meetup:meetups(id, title, date, time, location, status)")
    .eq("participant_id", me)
    .neq("response", "declined");
  if (e2) throw e2;

  type MeetupRow = {
    id: string;
    title: string;
    date: string;
    time: string | null;
    location: string | null;
    status: string;
  };

  const all = new Map<string, MeetupRow>();
  for (const m of (created ?? []) as MeetupRow[]) all.set(m.id, m);
  for (const r of (parts ?? []) as { meetup: MeetupRow | null }[]) {
    const m = r.meetup;
    if (m && m.date >= today && m.status !== "cancelled") all.set(m.id, m);
  }

  const ids = Array.from(all.keys());
  if (ids.length === 0) return [];
  const { data: pp, error: e3 } = await sb
    .from("meetup_participants")
    .select(
      "meetup_id, guest_name, user:users(first_name, last_name)",
    )
    .in("meetup_id", ids);
  if (e3) throw e3;

  const partMap = new Map<string, string[]>();
  for (const r of (pp ?? []) as {
    meetup_id: string;
    guest_name: string | null;
    user: UserRow | null;
  }[]) {
    const name = r.guest_name ?? fullName(r.user ?? {});
    if (!partMap.has(r.meetup_id)) partMap.set(r.meetup_id, []);
    partMap.get(r.meetup_id)!.push(name);
  }

    return Array.from(all.values())
      .map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        time: m.time,
        location: m.location,
        participants: partMap.get(m.id) ?? [],
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  ["upcoming-meetups"],
  { revalidate: TTL_SHORT, tags: [TAGS.meetups] },
);

export async function getUpcomingMeetups(): Promise<CalendarMeetup[]> {
  const me = await requireUserId();
  return _fetchUpcomingMeetups(me);
}

// ── Trips ──────────────────────────────────────────────────────────────

const _fetchTrips = unstable_cache(
  async (me: string): Promise<TripCardData[]> => {
    const sb = admin();

  type TripRow = {
    id: string;
    start_date: string;
    end_date: string;
    reason: string | null;
    orbit_id: string;
    orbit: {
      name: string;
      country_code: string | null;
      type: string;
    } | null;
  };

  const { data: myTripsRaw, error } = await sb
    .from("trips")
    .select(
      "id, start_date, end_date, reason, orbit_id, orbit:orbits(name, country_code, type)",
    )
    .eq("user_id", me)
    .order("start_date");
  if (error) throw error;
  const myTrips = (myTripsRaw ?? []) as TripRow[];

  if (myTrips.length === 0) return [];

    const mutualIds = await _fetchMutualIds(me);
  const orbitIds = Array.from(new Set(myTrips.map((t) => t.orbit_id)));

  type FriendTripRow = {
    user_id: string;
    orbit_id: string;
    start_date: string;
    end_date: string;
    user: { first_name: string | null } | null;
  };
  const { data: friendTripsRaw } = await sb
    .from("trips")
    .select(
      "user_id, orbit_id, start_date, end_date, user:users!trips_user_id_fkey(first_name)",
    )
    .in("orbit_id", orbitIds)
    .in(
      "user_id",
      mutualIds.length > 0
        ? mutualIds
        : ["00000000-0000-0000-0000-000000000000"],
    );
  const friendTrips = (friendTripsRaw ?? []) as FriendTripRow[];

    return myTrips.map((t) => {
      const overlaps = friendTrips
        .filter(
          (ft) =>
            ft.orbit_id === t.orbit_id &&
            ft.start_date <= t.end_date &&
            ft.end_date >= t.start_date,
        )
        .map((ft) => ft.user?.first_name ?? "");
      return {
        id: t.id,
        city: t.orbit?.name ?? "",
        country: countryName(t.orbit?.country_code ?? null) ?? t.orbit?.name ?? "",
        countryCode: t.orbit?.country_code ?? null,
        start: t.start_date,
        end: t.end_date,
        reason: t.reason,
        overlaps: Array.from(new Set(overlaps.filter(Boolean))),
      };
    });
  },
  ["trips"],
  { revalidate: TTL_MEDIUM, tags: [TAGS.trips, TAGS.friends] },
);

export async function getTrips(): Promise<TripCardData[]> {
  const me = await requireUserId();
  return _fetchTrips(me);
}

function countryName(code: string | null): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    DE: "Deutschland",
    ES: "Spanien",
    PT: "Portugal",
    FR: "Frankreich",
    IT: "Italien",
    NL: "Niederlande",
    GB: "England",
    US: "USA",
    TH: "Thailand",
  };
  return map[code] ?? code;
}

// ── Notifications ──────────────────────────────────────────────────────

const _fetchNotifications = unstable_cache(
  async (me: string): Promise<NotificationItem[]> => {
    const sb = admin();
  type NotificationRow = {
    id: string;
    type: NotificationItem["type"];
    payload: Record<string, string>;
    created_at: string;
    read_at: string | null;
  };
  const { data: raw, error } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", me)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const data = (raw ?? []) as NotificationRow[];

  const actorIds = Array.from(
    new Set(
      data
        .map((n) => n.payload?.actor_id)
        .filter((x): x is string => !!x),
    ),
  );
  const actors = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: us } = await sb
      .from("users")
      .select("id, first_name, last_name")
      .in("id", actorIds);
    for (const u of (us ?? []) as UserRow[]) actors.set(u.id, fullName(u));
  }

    return data.map((n) => {
      const actor = actors.get(n.payload?.actor_id) ?? "Jemand";
      const orbit = n.payload?.orbit ?? "";
      const { title, body } = renderNotification(
        n.type,
        actor,
        orbit,
        n.payload,
      );
      return {
        id: n.id,
        type: n.type,
        title,
        body,
        when: relativeTime(n.created_at),
        unread: n.read_at === null,
        href: hrefForNotification(n.type, n.payload),
      };
    });
  },
  ["notifications-list"],
  { revalidate: TTL_SHORT, tags: [TAGS.notifications] },
);

export async function getNotifications(): Promise<NotificationItem[]> {
  const me = await requireUserId();
  return _fetchNotifications(me);
}

function hrefForNotification(
  type: NotificationItem["type"],
  payload: Record<string, string>,
): string {
  switch (type) {
    case "invite":
    case "reschedule":
      return payload.meetup_id ? `/meetup/${payload.meetup_id}` : "/calendar";
    case "trip_overlap":
      return payload.trip_id ? `/trip/${payload.trip_id}` : "/trips";
    case "new_in_orbit":
    case "new_signup":
      return payload.actor_id ? `/profile/${payload.actor_id}` : "/";
  }
}

function renderNotification(
  type: NotificationItem["type"],
  actor: string,
  orbit: string,
  payload: Record<string, string>,
) {
  switch (type) {
    case "invite":
      return {
        title: `${actor} will dich treffen`,
        body: payload.title ?? "Neue Meetup-Einladung",
      };
    case "reschedule":
      return {
        title: `${actor} schlägt einen neuen Termin vor`,
        body: payload.message ?? "—",
      };
    case "new_in_orbit":
      return {
        title: `${actor} ist jetzt in ${orbit}`,
        body: `Im selben Orbit wie du.`,
      };
    case "new_signup":
      return {
        title: `${actor} ist jetzt auf Orbit`,
        body: orbit ? `Sie ist gerade in ${orbit}.` : "—",
      };
    case "trip_overlap":
      return {
        title: `${actor} reist zur gleichen Zeit nach ${orbit}`,
        body: "Vielleicht ein gemeinsamer Tag?",
      };
  }
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `vor ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  if (d === 1) return "gestern";
  if (d < 7) return `vor ${d} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
  });
}

// ── Profile detail ─────────────────────────────────────────────────────

const _fetchPersonProfile = unstable_cache(
  async (me: string, id: string) => {
    const sb = admin();
  const [{ data: userRaw }, { data: locRaw }] = await Promise.all([
    sb.from("users").select("*").eq("id", id).maybeSingle(),
    sb
      .from("user_locations")
      .select("last_seen_at, orbit:orbits(name)")
      .eq("user_id", id)
      .maybeSingle(),
  ]);
  if (!userRaw) return null;
  const user = userRaw as UserRow;
  const loc = locRaw as
    | { last_seen_at: string; orbit: { name: string } | null }
    | null;

    const mutualIds = await _fetchMutualIds(me);
  const isFriend = mutualIds.includes(id);

  let mutualsCount = 0;
  if (!isFriend) {
    const { data: theirFriends } = await sb
      .from("friend_links")
      .select("user_a, user_b")
      .eq("status", "mutual")
      .or(`user_a.eq.${id},user_b.eq.${id}`);
    const theirIds = (
      (theirFriends ?? []) as { user_a: string; user_b: string }[]
    ).map((r) => (r.user_a === id ? r.user_b : r.user_a));
    mutualsCount = theirIds.filter((x) => mutualIds.includes(x)).length;
  }

    return {
      id: user.id,
      name: fullName(user),
      city: loc?.orbit?.name ?? "—",
      since: loc?.last_seen_at ? fmtDay(loc.last_seen_at) : "—",
      isFriend,
      mutualsCount,
      tone: toneFor(user.id),
    };
  },
  ["person-profile"],
  { revalidate: TTL_MEDIUM, tags: [TAGS.user, TAGS.friends] },
);

export async function getPersonProfile(id: string) {
  const me = await requireUserId();
  return _fetchPersonProfile(me, id);
}

// ── Personal Space ─────────────────────────────────────────────────────

const _fetchPersonalSpaceData = unstable_cache(
  async (me: string) => {
    const sb = admin();
    const [meRes, friendsRes, contactsTotal, contactsOnOrbit] =
      await Promise.all([
        _fetchMe(me),
        (async () => {
          const ids = await _fetchMutualIds(me);
          if (ids.length === 0) return [];
          const { data } = await sb
            .from("users")
            .select("id, first_name, last_name")
            .in("id", ids)
            .limit(8);
          return ((data ?? []) as UserRow[]).map((u) => ({
            id: u.id,
            name: fullName(u),
            tone: toneFor(u.id),
          }));
        })(),
        sb
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", me),
        sb
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", me)
          .not("matched_user_id", "is", null),
      ]);

    return {
      me: meRes,
      friends: friendsRes,
      contactsTotal: contactsTotal.count ?? 0,
      contactsOnOrbit: contactsOnOrbit.count ?? 0,
    };
  },
  ["personal-space-data"],
  {
    revalidate: TTL_MEDIUM,
    tags: [TAGS.user, TAGS.friends, TAGS.contacts],
  },
);

export async function getPersonalSpaceData() {
  const me = await requireUserId();
  return _fetchPersonalSpaceData(me);
}

// ── Notification Badge ─────────────────────────────────────────────────

const _fetchUnreadNotificationCount = unstable_cache(
  async (me: string): Promise<number> => {
    const { count } = await admin()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", me)
      .is("read_at", null);
    return count ?? 0;
  },
  ["unread-notification-count"],
  { revalidate: TTL_SHORT, tags: [TAGS.notifications] },
);

export async function getUnreadNotificationCount(): Promise<number> {
  const me = await requireUserId();
  return _fetchUnreadNotificationCount(me);
}
