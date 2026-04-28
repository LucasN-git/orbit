type Props = {
  size?: number;
  className?: string;
  /** Anzahl der Ringe um das Zentrum (default 3) */
  rings?: number;
  /** Sichtbare Strichstärke in viewBox-Einheiten (0..100). */
  strokeWidth?: number;
};

/**
 * Brand-Mark: solider Akzent-Punkt im Zentrum + n konzentrische Orbits.
 * Vollständig 2D (keine Perspektive). Rings nehmen `currentColor`,
 * Zentrum bleibt immer in `--stamp` (Akzentfarbe).
 */
export function OrbitLogo({
  size = 96,
  className = "",
  rings = 3,
  strokeWidth = 2,
}: Props) {
  const cx = 50;
  const cy = 50;
  const centerR = 8;
  // Outermost ring just inside viewBox
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
          // outer ring fadest, inner most prominent
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
      <circle cx={cx} cy={cy} r={centerR} fill="var(--stamp)" />
    </svg>
  );
}
