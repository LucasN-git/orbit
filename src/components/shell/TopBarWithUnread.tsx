import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { getUnreadNotificationCount } from "@/lib/data";

type Props = {
  title: string;
  large?: boolean;
  trailing?: ReactNode;
  leading?: ReactNode;
};

/**
 * Server-Component-Wrapper, der den Notification-Badge async holt.
 * In <Suspense fallback={<TopBar ... unread={0} />}> einwickeln, damit der
 * Tab-Header sofort rendert und der Dot nachstreamt — bei warmem
 * unstable_cache (TTL 30s) ist das ohnehin <1ms.
 */
export async function TopBarWithUnread(props: Props) {
  const unread = await getUnreadNotificationCount();
  return <TopBar {...props} unread={unread} />;
}
