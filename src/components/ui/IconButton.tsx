import { ButtonHTMLAttributes, forwardRef } from "react";

type Size = "sm" | "md";

/**
 * Editorial circle-action style: cream container, hairline border, soft shadow,
 * outline glyph in ink-primary. Use for TopBar trailing/leading actions, Sheet
 * dismiss, Bookmark/Share — everything that is *action* but not a primary CTA.
 *
 * Exported as both a `<button>` component and a class-string helper so
 * `<Link>` / `<a>` callers can apply the same look without prop-drilling.
 */
export const iconButtonClasses = (size: Size = "md") => {
  const dims = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  return `${dims} inline-flex items-center justify-center rounded-full bg-raised text-ink-primary hairline shadow-[var(--shadow-card)] transition-all active:scale-[0.97] active:bg-surface-accent disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed`;
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { size?: Size };

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ size = "md", className = "", type, children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={`${iconButtonClasses(size)} ${className}`}
      {...rest}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = "IconButton";
