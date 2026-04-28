"use server";

import { revalidatePath, updateTag } from "next/cache";
import { admin } from "@/lib/supabase/admin";
import { requireUserId } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";

/**
 * Markiert alle ungelesenen Notifications des Users als gelesen.
 * Triggert revalidate, damit der Bell-Badge in der TopBar verschwindet.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const me = await requireUserId();
  await admin()
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("user_id", me)
    .is("read_at", null);
  updateTag(TAGS.notifications);
  revalidatePath("/notifications");
}
