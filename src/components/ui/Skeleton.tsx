import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...rest }: Props) {
  return (
    <div
      aria-hidden
      className={`bg-sunken animate-pulse rounded-[var(--radius-s)] ${className}`}
      {...rest}
    />
  );
}
