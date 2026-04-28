import Link from "next/link";
import { OrbitLogo } from "@/components/OrbitLogo";
import { LoginForm } from "../_components/LoginForm";

type SearchParams = Promise<{ error?: string; sent?: string }>;

export default async function OnboardingLogin({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="flex flex-col h-full bg-canvas">
      <div className="flex-1 px-6 pt-16 pb-6 flex flex-col">
        <div className="text-ink-primary mb-10">
          <OrbitLogo size={56} />
        </div>

        <h1 className="t-display-l mb-3">Willkommen.</h1>
        <p className="t-body-l text-ink-secondary mb-10 max-w-[300px]">
          Finde heraus, wer von deinen Leuten gerade in deiner Stadt ist.
        </p>

        <LoginForm error={error} sent={sent} />
      </div>

      <div className="px-6 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
        <Link
          href="/onboarding"
          className="block text-center t-body-s text-ink-tertiary"
        >
          ← Zurück
        </Link>
      </div>
    </div>
  );
}
