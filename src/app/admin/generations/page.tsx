import React from "react";
import { GenerationsClient } from "@/components/admin/GenerationsClient";
import { getAdminGenerations } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Generation Monitoring",
  description:
    "Monitor Beevo's 9-stage video generation pipeline, dynamic image counts, credit holds, and actual AI render costs.",
  path: "/admin/generations",
  noIndex: true,
});

export default function AdminGenerationsPage() {
  const response = getAdminGenerations();
  return (
    <GenerationsClient
      apiState={response.state}
      apiError={response.error}
      initialGenerations={response.data}
    />
  );
}
