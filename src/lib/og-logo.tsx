/**
 * Renders the Orbit brand-mark (rings + planets + center) as a div-tree for
 * Satori (next/og). SVG markup is not supported by Satori — we approximate the
 * SVG geometry by absolutely positioning circular divs.
 *
 * Geometry mirrors {@link ../components/OrbitLogo.tsx}:
 *   - 100-unit virtual viewBox scaled to `size`
 *   - innerMin = 12, outerMax = 48, ringRadii spaced linearly
 *   - planet angles: 60°, 200°, 320° (deterministic, diagonal)
 *   - center radius = 8, planet radius = 2.5, stroke = 2 (in viewBox units)
 */

const PLANET_ANGLES_DEG = [60, 200, 320];

const INK = "#2b2722";
const STAMP = "#d64300";
const CANVAS = "#f8f5ec";

type Options = {
  /** Output size in px (square). */
  size: number;
  /** If true, omits rounded background container — use when the platform
   *  applies its own rounded mask (e.g. iOS apple-touch-icon). */
  flush?: boolean;
  /** If true, scales the logo down to fit a maskable safe-zone (~80% of size).
   *  Required for PWA `purpose: "maskable"` icons on Android, where the
   *  launcher applies an aggressive shape mask. */
  padded?: boolean;
};

export function OgLogoTree({ size, flush = false, padded = false }: Options) {
  const scale = size / 100;
  // Maskable spec: critical content within 80% diameter (40% radius from center).
  // Padded uses outer radius 40 instead of 48; everything else scales proportionally.
  const outerVB = padded ? 40 : 48;
  const innerVB = padded ? 10 : 12;
  const midVB = padded ? 25 : 30;
  const innerR = innerVB * scale;
  const midR = midVB * scale;
  const outerR = outerVB * scale;
  const shrink = padded ? 40 / 48 : 1;
  const strokeW = Math.max(2, Math.round(2 * scale * shrink));
  const centerD = Math.round(16 * scale * shrink);
  const planetD = Math.round(5 * scale * shrink);
  const center = size / 2;

  const ring = (radius: number, opacity: number) => {
    const d = Math.round(radius * 2);
    return {
      position: "absolute" as const,
      top: Math.round(center - radius),
      left: Math.round(center - radius),
      width: d,
      height: d,
      borderRadius: "50%",
      border: `${strokeW}px solid ${INK}`,
      opacity,
      display: "flex",
    };
  };

  const planet = (radius: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const x = center + radius * Math.cos(rad);
    const y = center + radius * Math.sin(rad);
    return {
      position: "absolute" as const,
      top: Math.round(y - planetD / 2),
      left: Math.round(x - planetD / 2),
      width: planetD,
      height: planetD,
      borderRadius: "50%",
      background: INK,
      display: "flex",
    };
  };

  const containerBase = {
    width: "100%",
    height: "100%",
    position: "relative" as const,
    background: CANVAS,
    display: "flex",
  };
  const container = flush
    ? containerBase
    : { ...containerBase, borderRadius: Math.round(size * 0.22) };

  const ringRadii = [innerR, midR, outerR];
  // Mirror OrbitLogo opacity ramp: outer most opaque, inner softest.
  const ringOpacities = [0.533, 0.767, 1.0];

  return (
    <div style={container}>
      {/* Rings — render outer first so inner sits on top (matches SVG paint order). */}
      <div style={ring(outerR, ringOpacities[2])} />
      <div style={ring(midR, ringOpacities[1])} />
      <div style={ring(innerR, ringOpacities[0])} />
      {/* Planets — one per ring. */}
      <div style={planet(outerR, PLANET_ANGLES_DEG[2])} />
      <div style={planet(midR, PLANET_ANGLES_DEG[1])} />
      <div style={planet(innerR, PLANET_ANGLES_DEG[0])} />
      {/* Center dot in stamp orange. */}
      <div
        style={{
          position: "absolute",
          top: Math.round(center - centerD / 2),
          left: Math.round(center - centerD / 2),
          width: centerD,
          height: centerD,
          borderRadius: "50%",
          background: STAMP,
          display: "flex",
        }}
      />
    </div>
  );
}
