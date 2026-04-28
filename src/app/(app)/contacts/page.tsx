import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronRightIcon } from "@/components/icons";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";
import { fullName, toneFor, type Tone } from "@/lib/data-helpers";
import { AddByUsername } from "./AddByUsername";
import { InviteCard } from "@/components/InviteCard";

export default async function ContactsPage() {
  const me = await requireUserId();
  const sb = admin();

  const [
    { data: linksRaw },
    { data: rawContacts, count: total },
    { data: meRow },
  ] = await Promise.all([
    sb
      .from("friend_links")
      .select("user_a, user_b, status")
      .or(`user_a.eq.${me},user_b.eq.${me}`),
    sb
      .from("contacts")
      .select("id, display_name, matched_user_id", { count: "exact" })
      .eq("user_id", me)
      .order("display_name"),
    sb.from("users").select("first_name").eq("id", me).maybeSingle(),
  ]);
  const myFirstName =
    (meRow as { first_name: string | null } | null)?.first_name ?? "Jemand";

  type LinkRow = {
    user_a: string;
    user_b: string;
    status: "mutual" | "pending";
  };
  const links = (linksRaw ?? []) as LinkRow[];
  const friendIds = links
    .filter((l) => l.status === "mutual")
    .map((l) => (l.user_a === me ? l.user_b : l.user_a));

  let friends: { id: string; name: string; tone: Tone }[] = [];
  if (friendIds.length > 0) {
    const { data: us } = await sb
      .from("users")
      .select("id, first_name, last_name, username")
      .in("id", friendIds);
    type UserRow = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      username: string | null;
    };
    friends = ((us ?? []) as UserRow[])
      .map((u) => ({
        id: u.id,
        name: fullName(u),
        tone: toneFor(u.id) as Tone,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  type ContactRow = {
    id: string;
    display_name: string;
    matched_user_id: string | null;
  };
  const contacts = (rawContacts ?? []) as ContactRow[];
  const matchedCount = contacts.filter((c) => c.matched_user_id).length;
  const unmatched = contacts.filter((c) => !c.matched_user_id);

  return (
    <>
      <TopBar
        title="Kontakte"
        showBell={false}
        leading={
          <Link
            href="/personal"
            aria-label="Zurück"
            className="t-label-l text-postage -ml-1"
          >
            ← Profil
          </Link>
        }
      />

      <div className="px-4 pb-28 space-y-6">
        <Card>
          <div className="t-display-s text-ink-primary mb-1">
            {matchedCount} von {total ?? 0} Kontakten auf Orbit
          </div>
          <p className="t-body-m text-ink-secondary">
            Im iOS-Build matchen wir dein Adressbuch automatisch
            (gehasht, kein Klartext). Im Web kannst du Leute über ihren
            Username hinzufügen.
          </p>
        </Card>

        <InviteCard inviterName={myFirstName} mutualCount={friendIds.length} />

        <AddByUsername />

        {friends.length > 0 && (
          <section>
            <SectionHeader
              title={`Mutuals · ${friends.length}`}
            />
            <Card className="p-0 overflow-hidden">
              <ul>
                {friends.map((f, i) => (
                  <li
                    key={f.id}
                    className={`${i === 0 ? "" : "hairline-top"}`}
                  >
                    <Link
                      href={`/profile/${f.id}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <Avatar name={f.name} tone={f.tone} size={36} />
                      <span className="t-body-l flex-1 truncate">
                        {f.name}
                      </span>
                      <ChevronRightIcon
                        size={18}
                        className="text-ink-tertiary"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {unmatched.length > 0 && (
          <section>
            <SectionHeader
              title={`Aus deinem Adressbuch · ${unmatched.length}`}
            />
            <p className="t-body-s text-ink-secondary px-1 mb-2">
              Diese Kontakte sind noch nicht auf Orbit. Lade sie ein.
            </p>
            <Card className="p-0 overflow-hidden">
              <ul>
                {unmatched.slice(0, 50).map((c, i) => (
                  <li
                    key={c.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i === 0 ? "" : "hairline-top"
                    }`}
                  >
                    <Avatar
                      name={c.display_name}
                      tone="sky"
                      size={36}
                    />
                    <span className="t-body-l flex-1 truncate text-ink-secondary">
                      {c.display_name}
                    </span>
                    <span className="t-label-s text-ink-tertiary">
                      Einladen
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </div>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="t-display-s text-ink-primary mb-2 px-1">{title}</h2>;
}
