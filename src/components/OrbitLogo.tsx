type Props = {
  size?: number;
  className?: string;
  /** Anzahl der Ringe um das Zentrum (default 3) */
  rings?: number;
  /** Sichtbare Strichstärke in viewBox-Einheiten (0..100). */
  strokeWidth?: number;
  /** Planet-Punkte auf den Ringen anzeigen (default true). */
  planets?: boolean;
  /** Radius eines Planeten in viewBox-Einheiten (default 2.5). */
  planetRadius?: number;
};

// Deterministische Winkel (in Grad) pro Ring — diagonal verteilt, kein Cluster.
// Über 6 Ringe hinaus wird via Modulo wiederholt.
const PLANET_ANGLES = [60, 200, 320, 110, 250, 30];

/**
 * Brand-Mark: solider Akzent-Punkt im Zentrum + n konzentrische Orbits +
 * Planeten-Punkte auf den Ringen. Vollständig 2D (keine Perspektive).
 * Ringe und Planeten nehmen `currentColor`, Zentrum bleibt immer in `--stamp`.
 */
export function OrbitLogo({
  size = 96,
  className = "",
  rings = 3,
  strokeWidth = 2,
  planets = true,
  planetRadius = 2.5,
}: Props) {
  const cx = 50;
  const cy = 50;
  const centerR = 8;
  const outerMax = 50 - strokeWidth;
  const innerMin = centerR + 4;
  const ringRadii: number[] = [];
  for (let i = 0; i < rings; i++) {
    const t = rings === 1 ? 1 : i / (rings - 1);
    ringRadii.push(innerMin + t * (outerMax - innerMin));
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role="img"
      aria-label="orbit"
    >
      {ringRadii
        .slice()
        .reverse()
        .map((r, i) => {
          const opacity = 1 - (i / Math.max(1, rings)) * 0.7;
          return (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          );
        })}
      {planets &&
        ringRadii.map((r, i) => {
          const angle =
            (PLANET_ANGLES[i % PLANET_ANGLES.length] * Math.PI) / 180;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          return (
            <circle
              key={`planet-${i}`}
              cx={x}
              cy={y}
              r={planetRadius}
              fill="currentColor"
            />
          );
        })}
      <circle cx={cx} cy={cy} r={centerR} fill="var(--stamp)" />
    </svg>
  );
}
