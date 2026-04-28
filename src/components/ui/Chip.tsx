import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ active, className = "", ...rest }: Props) {
  return (
    <button
      className={`t-label-m h-9 px-4 rounded-[var(--radius-m)] transition-colors ${
        active
          ? "bg-ink-primary text-canvas"
          : "bg-surface-accent text-ink-primary hairline"
      } ${className}`}
      {...rest}
    />
  );
}
