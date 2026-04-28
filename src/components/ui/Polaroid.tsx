import { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  caption?: string;
  rotation?: number;
  className?: string;
};

/**
 * Polaroid-Frame — DESIGN1.md §5.4 / §7.
 * White card, 80×96, asymmetric padding (sides 8, top 8, bottom 24).
 */
export function Polaroid({
  children,
  caption,
  rotation = 0,
  className = "",
}: Props) {
  return (
    <div
      className={`bg-white shadow-[var(--shadow-card)] hairline ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        padding: "8px 8px 24px",
      }}
    >
      <div className="bg-sunken w-full aspect-[5/6] flex items-center justify-center overflow-hidden">
        {children}
      </div>
      {caption && (
        <div
          className="mt-2 text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 12,
            color: "var(--ink-secondary)",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
