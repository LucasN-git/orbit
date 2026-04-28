import { SVGProps } from "react";

/**
 * Duotone-Style icons inspired by Phosphor.
 * Convention: secondary fill at 25% opacity, primary stroke at 1.5pt.
 * Color via `currentColor`, secondary via `--icon-secondary` CSS var (defaults
 * to currentColor at 25%).
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const wrap = (size: number | undefined, props: SVGProps<SVGSVGElement>) => ({
  width: size ?? 24,
  height: size ?? 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

const fill = "currentColor";
const fillOp = 0.22;

export function BellIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path
        d="M5 17h14l-1.5-2V11a5.5 5.5 0 0 0-11 0v4L5 17Z"
        fill={fill}
        fillOpacity={fillOp}
      />
      <path d="M5 17h14l-1.5-2V11a5.5 5.5 0 0 0-11 0v4L5 17Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function OrbitIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      {/* 3 konzentrische Orbits + Akzent-Zentrum (2D, no perspective) */}
      <circle cx="12" cy="12" r="11" strokeWidth={1.25} opacity={0.3} />
      <circle cx="12" cy="12" r="8" strokeWidth={1.25} opacity={0.6} />
      <circle cx="12" cy="12" r="5" strokeWidth={1.25} />
      <circle cx="12" cy="12" r="2.5" fill="var(--stamp)" stroke="none" />
    </svg>
  );
}

export function CalendarIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        fill={fill}
        fillOpacity={fillOp}
      />
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function PlaneIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path
        d="M3 13.5 21 6l-3 14-5-6-7 1Z"
        fill={fill}
        fillOpacity={fillOp}
      />
      <path d="M3 13.5 21 6l-3 14-5-6-7 1Z" />
      <path d="M13 14l8-8" />
    </svg>
  );
}

export function UserIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <circle cx="12" cy="8" r="4" fill={fill} fillOpacity={fillOp} />
      <circle cx="12" cy="8" r="4" />
      <path
        d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"
        fill={fill}
        fillOpacity={fillOp}
      />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
  );
}

export function PlusIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path d="M12 5v14M5 12h14" strokeWidth={2} />
    </svg>
  );
}

export function CloseIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronRightIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function PhoneIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path
        d="M5 4h3l2 5-2 1c1 2.5 3 4.5 5.5 5.5l1-2 5 2v3a2 2 0 0 1-2 2C9.5 20.5 3.5 14.5 3 7a2 2 0 0 1 2-3Z"
        fill={fill}
        fillOpacity={fillOp}
      />
      <path d="M5 4h3l2 5-2 1c1 2.5 3 4.5 5.5 5.5l1-2 5 2v3a2 2 0 0 1-2 2C9.5 20.5 3.5 14.5 3 7a2 2 0 0 1 2-3Z" />
    </svg>
  );
}

export function ChatIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path
        d="M4 5h16v11H9l-5 4V5Z"
        fill={fill}
        fillOpacity={fillOp}
      />
      <path d="M4 5h16v11H9l-5 4V5Z" />
    </svg>
  );
}

export function EnvelopeIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill={fill}
        fillOpacity={fillOp}
      />
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function MapPinIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path
        d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z"
        fill={fill}
        fillOpacity={fillOp}
      />
      <path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.2" />
    </svg>
  );
}

export function ListIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="2.5" cy="6" r="1" fill={fill} />
      <circle cx="2.5" cy="12" r="1" fill={fill} />
      <circle cx="2.5" cy="18" r="1" fill={fill} />
    </svg>
  );
}

export function GridIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <rect
        x="4"
        y="4"
        width="7"
        height="7"
        rx="1.5"
        fill={fill}
        fillOpacity={fillOp}
      />
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function StampIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path
        d="M5 7h14v9H5z"
        fill={fill}
        fillOpacity={fillOp}
      />
      <path d="M5 7h14v9H5z" />
      <circle cx="12" cy="11.5" r="2" />
      <path d="M5 4v1.5M9 4v1.5M13 4v1.5M17 4v1.5M5 17.5V19M9 17.5V19M13 17.5V19M17 17.5V19" />
    </svg>
  );
}

export function GearIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <circle cx="12" cy="12" r="3" fill={fill} fillOpacity={fillOp} />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </svg>
  );
}

export function ShareIcon({ size, ...p }: IconProps) {
  return (
    <svg {...wrap(size, p)}>
      <path d="M12 4v12M12 4l-4 4M12 4l4 4" />
      <path d="M5 14v5h14v-5" />
    </svg>
  );
}
