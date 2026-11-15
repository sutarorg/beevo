import React from "react";
import { SettingsClient } from "@/components/studio/SettingsClient";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Account Settings",
  description:
    "Manage your Beevo profile, password security, email notifications, session, and account settings.",
  path: "/app/settings",
  noIndex: true,
});

export default function SettingsPage() {
  return <SettingsClient />;
}
