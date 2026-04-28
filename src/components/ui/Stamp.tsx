import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  rotation?: number;
  className?: string;
};

/**
 * Stempel-Effekt — DESIGN1.md §7.
 * Outline-Style, accent.stamp, opacity 0.85, multiply blend.
 */
export function Stamp({ children, rotation = -8, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 border-2 border-stamp text-stamp t-label-s rounded-sm shadow-[var(--shadow-stamp)] ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity: 0.88,
        mixBlendMode: "multiply",
        letterSpacing: "0.6px",
      }}
    >
      {children}
    </span>
  );
}
