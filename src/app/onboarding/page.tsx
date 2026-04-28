import Link from "next/link";
import { OrbitLogo } from "@/components/OrbitLogo";

/**
 * Screen 0 — Startscreen
 * Großes Logo mit rotierenden Planeten. Sofort tappbar → Login (Screen 1).
 */
export default function OnboardingStartscreen() {
  return (
    <Link
      href="/onboarding/login"
      aria-label="Weiter"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#1F1A14] text-[#F8F5EC] active:opacity-90 transition-opacity"
    >
      <div className="flex flex-col items-center gap-8 orbit-fade-in">
        <OrbitLogo size={220} rings={4} strokeWidth={1.5} spin />
        <div className="flex flex-col items-center gap-2">
          <div
            style={{
              fontSize: 56,
              letterSpacing: "-1.4px",
              fontWeight: 700,
            }}
          >
            orbit
          </div>
          <div
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
      </div>

      <div className="absolute bottom-16 t-label-s orbit-pulse text-[#8C7A5A]">
        Tippe irgendwo
      </div>

      <style>{`
        @keyframes orbit-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes orbit-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.9; }
        }
        .orbit-fade-in {
          animation: orbit-fade-in 0.4s ease-out;
        }
        .orbit-pulse {
          animation: orbit-pulse 2.4s ease-in-out infinite;
        }
      `}</style>
    </Link>
  );
}
