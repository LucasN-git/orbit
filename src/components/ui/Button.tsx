import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "tertiary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
};

const base =
  "t-label-l inline-flex items-center justify-center gap-2 select-none transition-all active:scale-[0.97] disabled:active:scale-100 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "h-[52px] px-5 rounded-full bg-stamp text-ink-primary shadow-[var(--shadow-stamp)] hover:bg-stamp-pressed active:bg-stamp-pressed disabled:bg-ink-tertiary/30 disabled:text-ink-tertiary disabled:shadow-none",
  secondary:
    "h-[52px] px-5 rounded-full bg-raised text-ink-primary border border-ink-primary hover:bg-surface-accent active:bg-surface-accent",
  tertiary:
    "h-11 px-3 text-postage hover:underline underline-offset-4",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", block, className = "", ...rest }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${
        block ? "w-full" : ""
      } ${className}`}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
