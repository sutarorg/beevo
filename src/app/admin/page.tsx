import React from "react";
import { OverviewClient } from "@/components/admin/OverviewClient";
import { getAdminOverview } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin Overview",
  description:
    "Beevo operational metrics, generation volume, credit supply, and unit economics overview.",
  path: "/admin",
  noIndex: true,
});

export default function AdminOverviewPage() {
  const response = getAdminOverview();
  return (
    <OverviewClient
      apiState={response.state}
      apiError={response.error}
      snapshot={response.data}
    />
  );
}
