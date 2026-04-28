import { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  body: string;
  cta?: ReactNode;
};

/**
 * Empty State pattern — DESIGN1.md §9.
 * Sub-copy uses Fraunces italic (bewusste Ausnahme von der Body-Font-Regel).
 */
export function EmptyState({ icon, title, body, cta }: Props) {
  return (
    <div className="mx-auto max-w-[280px] text-center py-16 flex flex-col items-center gap-3">
      {icon && (
        <div className="text-ink-tertiary mb-2" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="t-display-m text-ink-primary">{title}</h3>
      <p
        className="t-body-m text-ink-secondary italic-display"
        style={{ fontSize: 16, lineHeight: "22px" }}
      >
        {body}
      </p>
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
