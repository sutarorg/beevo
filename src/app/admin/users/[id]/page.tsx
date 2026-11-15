import React from "react";
import { UserDetailClient } from "@/components/admin/UserDetailClient";
import { getAdminUserDetail } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — User Detail",
  description: "Inspect individual customer profile, credits, projects, videos, payments, ledger, and AI cost.",
  path: "/admin/users/detail",
  noIndex: true,
});

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = getAdminUserDetail(id);
  return (
    <UserDetailClient
      userId={id}
      apiState={response.state}
      apiError={response.error}
      user={response.data}
    />
  );
}
