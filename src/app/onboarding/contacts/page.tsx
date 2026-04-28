import { ContactsStep } from "../_components/ContactsStep";
import { skipOnboardingAndEnter } from "../actions";

/**
 * Screen 3 — Kontakte importieren (PRD §5.3, kritischster Screen).
 *
 * Im echten iOS-Build kommt expo-contacts; im Web haben wir keinen direkten
 * Adressbuch-Zugriff. Wir bieten zwei Pfade:
 *   1) Manuelles Einladen via Share-Link (funktioniert immer).
 *   2) Skip — geht direkt rein, Empty-State wartet.
 *
 * Ziel des Screens: User sofort einen Aha-Moment bringen, wenn schon
 * Kontakte gematched sind, sonst zum Invite triggern.
 */
export default function OnboardingContacts() {
  return (
    <div className="flex flex-col h-full bg-canvas">
      <div className="flex-1 px-6 pt-12 pb-6 flex flex-col">
        <h1 className="t-display-l mb-3">Wer ist schon dabei?</h1>
        <p className="t-body-l text-ink-secondary mb-8 max-w-[300px]">
          Wir matchen deine Kontakte mit anderen Orbit-Usern — nichts
          verlässt die App im Klartext.
        </p>

        <ContactsStep />
      </div>

      <div className="px-6 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 hairline-top">
        <form action={skipOnboardingAndEnter}>
          <button
            type="submit"
            className="block w-full text-center t-label-m text-postage"
          >
            Erstmal überspringen →
          </button>
        </form>
      </div>
    </div>
  );
}
