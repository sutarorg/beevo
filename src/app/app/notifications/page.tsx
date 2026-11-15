import React from "react";
import { NotificationsClient } from "@/components/studio/NotificationsClient";
import { getUserNotifications } from "@/lib/app-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Notifications",
  description: "View your Beevo Studio generation alerts, refund notices, and system updates.",
  path: "/app/notifications",
  noIndex: true,
});

export default function NotificationsPage() {
  const result = getUserNotifications();
  return <NotificationsClient initialNotifications={result.data} />;
}
