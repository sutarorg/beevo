import React from "react";
import { TransactionsClient } from "@/components/studio/TransactionsClient";
import { getUserTransactions } from "@/lib/app-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Transactions",
  description:
    "Inspect your Beevo credit purchases, deductions, reservations, refunds, releases, and adjustments.",
  path: "/app/transactions",
  noIndex: true,
});

export default function TransactionsPage() {
  const result = getUserTransactions();
  return <TransactionsClient initialTransactions={result.data} />;
}
