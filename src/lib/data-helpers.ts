/**
 * Shared helpers — kein "server-only", weil sie auch in Client-Components
 * genutzt werden (z.B. Avatar-Farbtöne).
 */

const TONE_CYCLE = ["stamp", "postage", "sky", "warning"] as const;
export type Tone = (typeof TONE_CYCLE)[number];

export function toneFor(id: string): Tone {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TONE_CYCLE[Math.abs(h) % TONE_CYCLE.length];
}

export function fullName(p: {
  first_name?: string | null;
  last_name?: string | null;
}) {
  return [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—";
}
