import { Card } from "@/components/ui/Card";
import { Stamp } from "@/components/ui/Stamp";
import type { FriendsCitiesMap as Data } from "@/lib/data";

type Props = { data: Data };

const VIEW_W = 320;
const VIEW_H = 200;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const R_INNER = 32;
const R_OUTER = 82;

export function FriendsCitiesMap({ data }: Props) {
  if (!data.me || data.cities.length === 0) return null;

  const me = data.me;
  const cosLat = Math.cos((me.lat * Math.PI) / 180);

  const projected = data.cities.map((c) => {
    const dx = (c.lng - me.lng) * cosLat;
    const dy = me.lat - c.lat;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return { city: c, dx, dy, dist };
  });

  const maxDist = Math.max(...projected.map((p) => p.dist));

  const points = projected.map(({ city, dx, dy, dist }, i) => {
    if (dist === 0 || maxDist === 0) {
      const angle = (i * 2 * Math.PI) / Math.max(projected.length, 1);
      return {
        city,
        x: CX + R_INNER * 0.55 * Math.cos(angle),
        y: CY + R_INNER * 0.55 * Math.sin(angle),
      };
    }
    const norm = Math.sqrt(dist / maxDist);
    const radius = R_INNER + norm * (R_OUTER - R_INNER);
    return {
      city,
      x: CX + radius * (dx / dist),
      y: CY + radius * (dy / dist),
    };
  });

  const totalFriends = data.cities.reduce(
    (sum, c) => sum + c.friends.length,
    0,
  );

  return (
    <Card variant="postcard" className="overflow-hidden !p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="t-label-s text-ink-tertiary mb-1">
            FREUNDE WELTWEIT
          </div>
          <div className="t-display-s text-ink-primary">
            {totalFriends}{" "}
            {totalFriends === 1 ? "Freund" : "Freunde"} in{" "}
            {data.cities.length}{" "}
            {data.cities.length === 1 ? "Stadt" : "Städten"}
          </div>
        </div>
        <Stamp rotation={6}>{data.cities.length}×</Stamp>
      </div>

      <div className="relative bg-canvas rounded-[var(--radius-m)] hairline overflow-hidden">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto block"
          aria-label="Karte mit Städten deiner Freunde"
        >
          <g
            stroke="var(--hairline)"
            strokeOpacity="0.55"
            fill="none"
            strokeDasharray="2 3"
          >
            <circle cx={CX} cy={CY} r={R_INNER} />
            <circle cx={CX} cy={CY} r={(R_INNER + R_OUTER) / 2} />
            <circle cx={CX} cy={CY} r={R_OUTER} />
          </g>

          {points.map((p, i) => (
            <line
              key={`l-${i}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="var(--hairline)"
              strokeOpacity="0.7"
              strokeDasharray="1 3"
            />
          ))}

          {points.map((p, i) => {
            const count = p.city.friends.length;
            return (
              <g key={`p-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={count > 1 ? 8 : 5.5}
                  fill="var(--stamp)"
                  stroke="var(--canvas)"
                  strokeWidth={1.5}
                />
                {count > 1 && (
                  <text
                    x={p.x}
                    y={p.y}
                    fontSize="8"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--canvas)"
                    fontFamily="var(--font-mono)"
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          })}

          <g>
            <circle
              cx={CX}
              cy={CY}
              r={7}
              fill="var(--ink-primary)"
              stroke="var(--canvas)"
              strokeWidth={2}
            />
            <circle cx={CX} cy={CY} r={2.5} fill="var(--canvas)" />
          </g>
        </svg>
      </div>

      <ul className="mt-4 space-y-1.5">
        {data.cities.slice(0, 5).map((c) => (
          <li
            key={c.orbitId}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-stamp shrink-0" />
              <span className="t-body-m text-ink-primary truncate">
                {c.city}
              </span>
            </div>
            <span className="t-mono text-ink-tertiary shrink-0">
              {c.friends.length}{" "}
              {c.friends.length === 1 ? "Freund" : "Freunde"}
            </span>
          </li>
        ))}
        {data.cities.length > 5 && (
          <li className="t-mono text-ink-tertiary pt-1">
            +{data.cities.length - 5} weitere
          </li>
        )}
      </ul>
    </Card>
  );
}
