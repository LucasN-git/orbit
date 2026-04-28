import { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "postcard";
  children?: ReactNode;
};

export function Card({
  variant = "default",
  className = "",
  children,
  ...rest
}: Props) {
  if (variant === "postcard") {
    return (
      <div
        className={`relative bg-raised rounded-[var(--radius-xl)] p-6 hairline paper-edge shadow-[var(--shadow-modal)] ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      className={`relative bg-raised rounded-[var(--radius-l)] p-4 hairline paper-edge shadow-[var(--shadow-card)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
