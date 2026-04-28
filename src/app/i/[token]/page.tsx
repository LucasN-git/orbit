import Link from "next/link";
import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { OrbitLogo } from "@/components/OrbitLogo";
import { Button } from "@/components/ui/Button";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

type Params = Promise<{ token: string }>;

export default async function InviteLandingPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const sb = admin();

  // RPC get_invite_meta liefert Inviter-Daten ohne Auth — siehe 0008_invites.sql
  const { data: rows, error } = await (
    sb.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )("get_invite_meta", { p_token: token });
  if (error) {
    return (
      <PhoneFrame>
        <FallbackError message={error.message} />
      </PhoneFrame>
    );
  }
  const meta = (
    rows as
      | {
          inviter_first: string | null;
          inviter_last: string | null;
          inviter_avatar: string | null;
          expired: boolean;
        }[]
      | null
  )?.[0];
  if (!meta) notFound();

  if (meta.expired) {
    return (
      <PhoneFrame>
        <FallbackError message="Dieser Einladungs-Link ist leider abgelaufen." />
      </PhoneFrame>
    );
  }

  const fullName =
    [meta.inviter_first, meta.inviter_last].filter(Boolean).join(" ") ||
    "Jemand";

  return (
    <PhoneFrame>
      <div className="flex flex-col h-full bg-canvas">
        <div className="flex-1 px-6 pt-16 pb-6 flex flex-col items-center text-center">
          <div className="text-postage mb-8">
            <OrbitLogo size={120} rings={4} strokeWidth={1.5} />
          </div>

          <h1 className="t-display-l mb-3">
            {fullName} hat dich eingeladen
          </h1>
          <p className="t-body-l text-ink-secondary max-w-[300px]">
            Orbit zeigt dir, wer von deinen Leuten gerade in deiner Stadt
            ist — kein Feed, keine Likes, keine Follower.
          </p>

          <div className="mt-12 w-full max-w-[300px] space-y-3">
            <Link href={`/onboarding/login?invite=${token}`} className="block">
              <Button block>Account erstellen</Button>
            </Link>
            <Link href="/onboarding/login" className="block">
              <Button block variant="secondary">
                Schon dabei? Einloggen
              </Button>
            </Link>
          </div>

          <p className="t-body-s text-ink-tertiary mt-12 max-w-[280px] italic-display">
            Datenschutz first: Stadt-Granularität, keine GPS-Speicherung,
            Telefonnummern nur gehasht.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

function FallbackError({ message }: { message: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 text-center">
      <h1 className="t-display-l mb-3">Ups.</h1>
      <p className="t-body-l text-ink-secondary mb-8">{message}</p>
      <Link href="/onboarding">
        <Button>Zur App</Button>
      </Link>
    </div>
  );
}
