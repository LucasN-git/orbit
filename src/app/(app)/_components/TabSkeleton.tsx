import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { TopBar } from "@/components/shell/TopBar";
import { ReactNode } from "react";

type Props = {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Anzahl Card-Platzhalter im Body (default 3). */
  rows?: number;
};

/**
 * Generisches Loading-Skeleton für die Tab-Pages. Rendert die echte TopBar
 * (mit unread=0 Fallback), darunter Card-Platzhalter mit Pulse — sodass
 * der Tab-Wechsel sofort visuell reagiert, während Daten streamen.
 */
export function TabSkeleton({ title, leading, trailing, rows = 3 }: Props) {
  return (
    <>
      <TopBar
        title={title}
        large
        leading={leading}
        trailing={trailing}
        unread={0}
      />
      <div className="px-4 pb-28 space-y-5">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-5 w-2/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </Card>
        ))}
      </div>
    </>
  );
}
