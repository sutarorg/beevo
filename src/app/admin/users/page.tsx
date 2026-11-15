import React from "react";
import { UsersClient } from "@/components/admin/UsersClient";
import { getAdminUsers } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Users",
  description: "Manage registered Beevo accounts, balances, generation usage, and status actions.",
  path: "/admin/users",
  noIndex: true,
});

export default function AdminUsersPage() {
  const response = getAdminUsers();
  return (
    <UsersClient
      apiState={response.state}
      apiError={response.error}
      initialUsers={response.data}
    />
  );
}
