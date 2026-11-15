"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Coins, ReceiptText, Search } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { CreditTransaction, TransactionType } from "@/lib/app-types";

interface TransactionsClientProps {
  initialTransactions: CreditTransaction[];
}

const CATEGORIES: { value: "all" | TransactionType; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "purchase", label: "Purchases" },
  { value: "deduction", label: "Deductions" },
  { value: "reservation", label: "Reservations" },
  { value: "refund", label: "Refunds" },
  { value: "release", label: "Releases" },
  { value: "admin_adjustment", label: "Admin adjustments" },
];

export function TransactionsClient({ initialTransactions }: TransactionsClientProps) {
  const [category, setCategory] = useState<"all" | TransactionType>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialTransactions.filter((tx) => {
      if (category !== "all" && tx.type !== category) return false;
      if (q && !tx.referenceLabel.toLowerCase().includes(q) && !tx.id.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [initialTransactions, category, query]);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Eyebrow showSparkle>Credit Ledger</Eyebrow>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
            Transactions
          </h1>
          <p className="mt-1 text-[14px] text-beevo-body">
            Every credit pack purchase, render reservation, deduction, release, refund, and
            adjustment recorded transparently.
          </p>
        </div>
        <Link href="/app/credits" className="beevo-btn-primary min-h-[46px] px-5 text-[14px]">
          <Coins className="h-4 w-4" aria-hidden="true" />
          Buy Credits
        </Link>
      </header>

      {/* Filter Bar */}
      <section className="space-y-3 rounded-[20px] border border-beevo-border bg-white p-4 shadow-beevo-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-beevo-muted"
              aria-hidden="true"
            />
            <label htmlFor="tx-search" className="sr-only">
              Search credit transactions
            </label>
            <input
              id="tx-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference ID or project..."
              className="min-h-[44px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas pl-10 pr-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
            />
          </div>
          <span className="text-[12.5px] font-semibold text-beevo-muted tabular-nums">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div role="group" aria-label="Filter transactions by category" className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                aria-pressed={active}
                className={`min-h-[40px] rounded-full border px-3.5 text-[12.5px] font-bold transition-colors ${
                  active
                    ? "border-beevo-ink bg-beevo-dark text-[#FFFDF7]"
                    : "border-beevo-border bg-beevo-canvas text-beevo-body hover:bg-beevo-cream"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Ledger Table / Empty State */}
      {filtered.length === 0 ? (
        <section className="rounded-[24px] border border-dashed border-beevo-border-warm bg-white px-6 py-12 text-center shadow-beevo-card sm:py-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-beevo-cream text-beevo-honey-text">
            <ReceiptText className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-[20px] font-extrabold text-beevo-ink">
            No credit transactions recorded yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-beevo-body">
            Your full credit ledger—covering purchases, deductions, reservations, refunds,
            releases, and admin adjustments—populates automatically once Supabase billing connects
            in Phase 4.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app/credits" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
              Explore Credit Packs
            </Link>
            <Link href="/app/create" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
              Open Creation Studio
            </Link>
          </div>
        </section>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-beevo-border bg-white shadow-beevo-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-beevo-border bg-beevo-canvas text-[12px] font-bold uppercase tracking-wide text-beevo-muted">
                  <th scope="col" className="px-5 py-3.5">Date</th>
                  <th scope="col" className="px-5 py-3.5">Category</th>
                  <th scope="col" className="px-5 py-3.5">Reference</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Credits</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beevo-border/80">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-beevo-cream/35">
                    <td className="px-5 py-3.5 tabular-nums text-beevo-muted">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold capitalize text-beevo-ink">
                      {tx.type.replace("_", " ")}
                    </td>
                    <td className="px-5 py-3.5 text-beevo-body">{tx.referenceLabel}</td>
                    <td className="px-5 py-3.5 text-right font-extrabold tabular-nums text-beevo-ink">
                      {tx.creditsDelta > 0 ? `+${tx.creditsDelta}` : tx.creditsDelta}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-beevo-muted">
                      {tx.balanceAfter !== null ? tx.balanceAfter.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-beevo-border md:hidden">
            {filtered.map((tx) => (
              <div key={tx.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[14px] font-extrabold capitalize text-beevo-ink">
                    {tx.type.replace("_", " ")}
                  </span>
                  <span className="font-display text-[15px] font-extrabold tabular-nums text-beevo-ink">
                    {tx.creditsDelta > 0 ? `+${tx.creditsDelta}` : tx.creditsDelta} cr
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-beevo-body">{tx.referenceLabel}</p>
                <p className="mt-1 text-[12px] text-beevo-muted">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
