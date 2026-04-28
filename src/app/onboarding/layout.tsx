import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { createClient } from "@/lib/supabase/server";

/**
 * Wer eingeloggt ist UND das Onboarding bereits abgeschlossen hat, soll
 * keine Onboarding-Route mehr zu Gesicht bekommen — auch dann nicht, wenn
 * der Pfad direkt aufgerufen wird (z.B. aus einer alten gemerkten URL).
 */
export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.onboarding_completed_at) {
      redirect("/");
    }
  }

  return <PhoneFrame>{children}</PhoneFrame>;
}
