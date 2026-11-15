import React from "react";
import { PaymentsClient } from "@/components/admin/PaymentsClient";
import { getAdminPayments } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Payments & Orders",
  description:
    "Review read-only Razorpay payment receipts, order IDs, credit pack settlements, and backend-initiated refunds.",
  path: "/admin/payments",
  noIndex: true,
});

export default function AdminPaymentsPage() {
  const response = getAdminPayments();
  return (
    <PaymentsClient
      apiState={response.state}
      apiError={response.error}
      initialPayments={response.data}
    />
  );
}
