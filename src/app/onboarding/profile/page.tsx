import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { ProfileStep } from "../_components/ProfileStep";

/**
 * Screen 1.5 — Profil ausfüllen.
 *
 * Vorname, Nachname und Telefonnummer sind Pflicht (PRD §5.2). OAuth-Provider
 * (Apple/Google) füllen Vorname und Nachname per `handle_new_user` Trigger
 * vor — der User muss dann nur noch Telefon ergänzen. Email-/Magic-Link-User
 * fangen leer an.
 *
 * Username ist optional, wird aber für QR-/Deep-Link-Add genutzt (PRD §6.6).
 */
export default async function OnboardingProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding/login");

  // Per Service-Role lesen — RLS lässt eigenes Profil zwar lesen, aber wir
  // sind eh im Trusted-Server-Context.
  const { data: profile } = await admin()
    .from("users")
    .select("first_name, last_name, username, phone")
    .eq("id", user.id)
    .maybeSingle();
  const p = (profile ?? {}) as {
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    phone?: string | null;
  };

  return (
    <div className="flex flex-col h-full bg-canvas">
      <div className="flex-1 px-6 pt-12 pb-6 flex flex-col">
        <h1 className="t-display-l mb-3">Erzähl uns von dir</h1>
        <p className="t-body-l text-ink-secondary mb-8 max-w-[300px]">
          Vorname, Nachname und Telefonnummer brauchen wir, damit dich deine
          Kontakte auf Orbit finden.
        </p>

        <ProfileStep
          defaults={{
            first_name: p.first_name ?? null,
            last_name: p.last_name ?? null,
            username: p.username ?? null,
            phone: p.phone ?? null,
          }}
        />
      </div>
    </div>
  );
}
