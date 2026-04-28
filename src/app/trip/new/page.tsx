import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";
import { fullName, toneFor, type Tone } from "@/lib/data-helpers";
import { TripForm } from "./TripForm";

export default async function NewTripPage() {
  const me = await requireUserId();
  const sb = admin();

  const [{ data: orbits }, mutuals] = await Promise.all([
    sb
      .from("orbits")
      .select("id, name, type, country_code")
      .eq("published", true)
      .order("name"),
    loadMutualsForPicker(me),
  ]);

  type OrbitOption = {
    id: string;
    name: string;
    type: "city" | "country" | "region";
    country_code: string | null;
  };
  return (
    <TripForm
      orbits={(orbits ?? []) as OrbitOption[]}
      mutuals={mutuals}
    />
  );
}

async function loadMutualsForPicker(meId: string) {
  const sb = admin();
  const { data: links } = await sb
    .from("friend_links")
    .select("user_a, user_b")
    .eq("status", "mutual")
    .or(`user_a.eq.${meId},user_b.eq.${meId}`);
  const ids = ((links ?? []) as { user_a: string; user_b: string }[]).map(
    (l) => (l.user_a === meId ? l.user_b : l.user_a),
  );
  if (ids.length === 0) return [];
  const { data: users } = await sb
    .from("users")
    .select("id, first_name, last_name")
    .in("id", ids);
  return (
    (users ?? []) as {
      id: string;
      first_name: string | null;
      last_name: string | null;
    }[]
  )
    .map((u) => ({
      id: u.id,
      name: fullName(u),
      tone: toneFor(u.id) as Tone,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
