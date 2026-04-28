import { Suspense } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { TopBarWithUnread } from "@/components/shell/TopBarWithUnread";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { getUpcomingMeetups } from "@/lib/data";
import { CalendarToggle } from "../_components/CalendarToggle";

export default function CalendarPage() {
  return (
    <>
      <Suspense fallback={<TopBar title="Kalender" large unread={0} />}>
        <TopBarWithUnread title="Kalender" large />
      </Suspense>

      <Suspense fallback={<CalendarBodySkeleton />}>
        <CalendarBody />
      </Suspense>
    </>
  );
}

async function CalendarBody() {
  const meetups = await getUpcomingMeetups();
  return (
    <div className="px-4 pb-28 space-y-5">
      <CalendarToggle meetups={meetups} />
    </div>
  );
}

function CalendarBodySkeleton() {
  return (
    <div className="px-4 pb-28 space-y-5">
      <Skeleton className="h-10 w-1/2" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </Card>
      ))}
    </div>
  );
}
