import React from "react";
import { CreditLedgerClient } from "@/components/admin/CreditLedgerClient";
import { getAdminCreditLedger } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Credit Ledger",
  description:
    "Immutable credit transaction ledger and audited administrative credit adjustment workbench.",
  path: "/admin/credits",
  noIndex: true,
});

export default function AdminCreditsPage() {
  const response = getAdminCreditLedger();
  return (
    <CreditLedgerClient
      apiState={response.state}
      apiError={response.error}
      initialEntries={response.data}
    />
  );
}
