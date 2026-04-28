import "server-only";
import { createHash } from "node:crypto";

/**
 * Telefonnummer-Helpers für Profil + Adressbuch-Matching.
 *
 * `normalizeToE164` macht aus User-Input ("0170 123 4567", "+49 170…",
 * "+1 415-555-…") eine kanonische E.164-Form ohne Trennzeichen. Default-
 * Country ist DE — Lucas' User-Basis. Internationaler Input mit explizitem
 * Country-Code (`+…`) wird respektiert.
 *
 * `hashPhone` ist die SHA-256-Konvention aus PRD §11.2: Klartext-Nummer +
 * Server-Salt → unbrauchbar ohne Salt, aber stabil über User-Sessions
 * hinweg. Salt aus `PHONE_HASH_SALT` (Vercel-Env). Fallback `orbit-dev` nur
 * für lokale Entwicklung — in Production muss die Variable gesetzt sein.
 */

export function normalizeToE164(
  raw: string | null | undefined,
  defaultCountry: "DE" = "DE",
): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;

  // Nur Ziffern und führendes + behalten.
  s = s.replace(/[\s\-()./]/g, "");

  // 00 → + (internationaler Wahl-Prefix).
  if (s.startsWith("00")) s = `+${s.slice(2)}`;

  // 0… → Default-Country prefix für DE.
  if (!s.startsWith("+") && s.startsWith("0") && defaultCountry === "DE") {
    s = `+49${s.slice(1)}`;
  }

  // Sonst: keinen Country-Code? Im Web-MVP nehmen wir DE an.
  if (!s.startsWith("+")) {
    s = `+49${s.replace(/^0+/, "")}`;
  }

  // Plus + 8–15 Ziffern (E.164).
  if (!/^\+\d{8,15}$/.test(s)) return null;
  return s;
}

export function hashPhone(e164: string): string {
  const salt = process.env.PHONE_HASH_SALT ?? "orbit-dev";
  return createHash("sha256").update(`${salt}:${e164}`).digest("hex");
}
