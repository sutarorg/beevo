import React from "react";
import { ConfigurationClient } from "@/components/admin/ConfigurationClient";
import { getAdminConfiguration } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — System Configuration",
  description:
    "Manage Beevo pricing packs, credit billing rules, generation concurrency settings, and creative presets.",
  path: "/admin/configuration",
  noIndex: true,
});

export default function AdminConfigurationPage() {
  const response = getAdminConfiguration();
  return (
    <ConfigurationClient
      apiState={response.state}
      apiError={response.error}
      initialConfig={response.data}
    />
  );
}
