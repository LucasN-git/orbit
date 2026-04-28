import Link from "next/link";

/**
 * Screen 0 — Startscreen
 * Cleaner dark Screen, "orbit / your social life" fadet sanft ein.
 * Tap irgendwo → Login (Screen 1). Bewusst nur Vibe, kein Feature-Pitch.
 */
export default function OnboardingStartscreen() {
  return (
    <Link
      href="/onboarding/login"
      aria-label="Weiter"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#1F1A14] text-[#F8F5EC] active:opacity-90 transition-opacity"
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className="t-display-xl orbit-fade-1"
          style={{
            fontSize: 56,
            letterSpacing: "-1.4px",
            fontWeight: 700,
          }}
        >
          orbit
        </div>
        <div
          className="orbit-fade-2"
          style={{
            fontFamily: "var(--font-body)",
            fontStyle: "italic",
            fontSize: 18,
            color: "#C9B894",
            letterSpacing: "0.2px",
          }}
        >
          your social life
        </div>
      </div>

      <div className="absolute bottom-16 t-label-s orbit-fade-3 text-[#8C7A5A]">
        Tippe irgendwo
      </div>

      {/* Inline keyframes — vermeidet einen extra Tailwind-Konfig-Eintrag */}
      <style>{`
        @keyframes orbit-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbit-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }
        .orbit-fade-1 {
          opacity: 0;
          animation: orbit-fade-up 1.2s 0.2s ease-out forwards;
        }
        .orbit-fade-2 {
          opacity: 0;
          animation: orbit-fade-up 1.2s 1s ease-out forwards;
        }
        .orbit-fade-3 {
          opacity: 0;
          animation: orbit-fade-up 0.8s 2.4s ease-out forwards,
                     orbit-pulse 2.4s 3.2s ease-in-out infinite;
        }
      `}</style>
    </Link>
  );
}
