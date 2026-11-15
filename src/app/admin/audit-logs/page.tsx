import React from "react";
import { AuditLogsClient } from "@/components/admin/AuditLogsClient";
import { getAdminAuditLogs } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Audit Logs",
  description:
    "Strictly read-only chronological audit history of all administrative actions and operational changes.",
  path: "/admin/audit-logs",
  noIndex: true,
});

export default function AdminAuditLogsPage() {
  const response = getAdminAuditLogs();
  return (
    <AuditLogsClient
      apiState={response.state}
      apiError={response.error}
      initialLogs={response.data}
    />
  );
}
