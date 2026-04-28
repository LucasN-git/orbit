import { TopBar } from "@/components/shell/TopBar";
import {
  getUpcomingMeetups,
  getUnreadNotificationCount,
} from "@/lib/data";
import { CalendarToggle } from "../_components/CalendarToggle";

export default async function CalendarPage() {
  const [meetups, unread] = await Promise.all([
    getUpcomingMeetups(),
    getUnreadNotificationCount(),
  ]);

  return (
    <>
      <TopBar title="Kalender" large unread={unread} />
      <div className="px-4 pb-28 space-y-5">
        <CalendarToggle meetups={meetups} />
      </div>
    </>
  );
}
