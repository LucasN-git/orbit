"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  OrbitIcon,
  PlaneIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";
import { ComponentType, SVGProps } from "react";

type Tab = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

const tabs: Tab[] = [
  { href: "/", label: "Orbit", icon: OrbitIcon },
  { href: "/calendar", label: "Kalender", icon: CalendarIcon },
  { href: "/trips", label: "Trips", icon: PlaneIcon },
  { href: "/personal", label: "Profil", icon: UserIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Tab Bar — DESIGN1.md §5.5 + PRD §8.1: 4 Tabs unten + Plus-Button mittig.
 * Notifications ist in der TopBar (PRD §6.2), nicht hier.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-30 bg-canvas hairline-top pt-1.5 pb-[max(env(safe-area-inset-bottom),12px)]"
      aria-label="Hauptnavigation"
    >
      <ul className="grid grid-cols-5 items-center px-2">
        {tabs.slice(0, 2).map((t) => (
          <TabLink key={t.href} tab={t} active={isActive(pathname, t.href)} />
        ))}
        <li className="flex justify-center">
          <Link
            href="/meetup/new"
            aria-label="Neues Meetup planen"
            className="w-14 h-14 -mt-6 rounded-full bg-stamp text-canvas inline-flex items-center justify-center shadow-[var(--shadow-stamp)] active:scale-[0.96] active:bg-stamp-pressed transition-transform"
          >
            <PlusIcon size={26} />
          </Link>
        </li>
        {tabs.slice(2).map((t) => (
          <TabLink key={t.href} tab={t} active={isActive(pathname, t.href)} />
        ))}
      </ul>
    </nav>
  );
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <li className="flex justify-center">
      <Link
        href={tab.href}
        className={`flex flex-col items-center gap-1 py-1.5 ${
          active ? "text-stamp" : "text-ink-tertiary"
        }`}
      >
        <Icon size={24} />
        <span className="t-label-s">{tab.label}</span>
      </Link>
    </li>
  );
}
