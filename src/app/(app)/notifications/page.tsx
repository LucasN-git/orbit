import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import {
  ChevronRightIcon,
  CloseIcon,
  EnvelopeIcon,
  OrbitIcon,
  PlaneIcon,
  StampIcon,
  UserIcon,
} from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { getNotifications, type NotificationItem } from "@/lib/data";
import { MarkReadOnView } from "./MarkReadOnView";

const iconFor: Record<
  NotificationItem["type"],
  { icon: React.ReactNode; tone: string }
> = {
  invite: { icon: <EnvelopeIcon size={20} />, tone: "text-stamp" },
  reschedule: { icon: <StampIcon size={20} />, tone: "text-warning" },
  new_in_orbit: { icon: <OrbitIcon size={20} />, tone: "text-postage" },
  new_signup: { icon: <UserIcon size={20} />, tone: "text-postage" },
  trip_overlap: { icon: <PlaneIcon size={20} />, tone: "text-sky" },
};

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <>
      <MarkReadOnView />
      <TopBar
        title="Briefkasten"
        large
        showBell={false}
        leading={
          <Link
            href="/"
            aria-label="Schließen"
            className="w-10 h-10 -ml-2 inline-flex items-center justify-center text-ink-primary"
          >
            <CloseIcon size={22} />
          </Link>
        }
      />

      <div className="px-4 pb-12 space-y-3">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<EnvelopeIcon size={32} />}
            title="Noch nichts im Briefkasten."
            body="Wenn jemand dich anpingt, landet's hier."
          />
        ) : (
          <>
            <p className="t-body-m text-ink-secondary mb-3">
              Einladungen, Änderungswünsche und Bewegungen in deinem Orbit.
            </p>
            <ul className="space-y-3">
              {notifications.map((n) => {
                const { icon, tone } = iconFor[n.type];
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      className="block active:scale-[0.99] transition-transform"
                    >
                      <Card className="flex gap-3 items-start">
                        <span
                          className={`mt-0.5 w-9 h-9 rounded-full bg-surface-accent inline-flex items-center justify-center shrink-0 ${tone}`}
                        >
                          {icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <div className="t-label-l text-ink-primary truncate">
                              {n.title}
                            </div>
                            {n.unread && (
                              <span
                                className="w-2 h-2 rounded-full bg-stamp shrink-0"
                                aria-label="ungelesen"
                              />
                            )}
                          </div>
                          <div className="t-body-m text-ink-secondary mt-1">
                            {n.body}
                          </div>
                          <div className="t-mono text-ink-tertiary mt-2">
                            {n.when}
                          </div>
                        </div>
                        <ChevronRightIcon
                          size={18}
                          className="text-ink-tertiary mt-1.5 shrink-0"
                        />
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
