"use client";

import { useEffect, useRef } from "react";
import { markAllNotificationsRead } from "./actions";

/**
 * Triggert markAllNotificationsRead beim ersten Mount der Notifications-
 * Page. Side-effect-only Komponent, rendert nichts.
 */
export function MarkReadOnView() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void markAllNotificationsRead();
  }, []);
  return null;
}
