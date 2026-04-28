import Link from "next/link";
import { ReactNode } from "react";
import { BellIcon } from "@/components/icons";

type Props = {
  title: string;
  large?: boolean;
  trailing?: ReactNode;
  leading?: ReactNode;
  showBell?: boolean;
  unread?: number;
};

/**
 * Navigation Bar — DESIGN1.md §5.6.
 * Höhe 52pt + Status Bar = ~96pt. Kein Backdrop-Blur.
 * Large-Title-Variant zeigt Fraunces 32 bei Scroll = 0.
 */
export function TopBar({
  title,
  large,
  trailing,
  leading,
  showBell = true,
  unread = 0,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-canvas hairline-bottom">
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 52 }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leading}
          {!large && (
            <h1 className="t-display-s text-ink-primary truncate">
              {title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trailing}
          {showBell && (
            <Link
              href="/notifications"
              aria-label="Benachrichtigungen"
              className="relative w-10 h-10 inline-flex items-center justify-center text-ink-primary"
            >
              <BellIcon size={22} />
              {unread > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-stamp" />
              )}
            </Link>
          )}
        </div>
      </div>
      {large && (
        <div className="px-4 pb-3">
          <h1 className="t-display-l text-ink-primary">{title}</h1>
        </div>
      )}
    </header>
  );
}
