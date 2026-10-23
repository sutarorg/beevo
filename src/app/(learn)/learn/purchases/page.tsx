"use client";

import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatINR } from "@/lib/domain";
import type { PurchaseRecord } from "@/lib/learner-types";
import { useAsyncData } from "@/lib/hooks";
import { getLearnerService } from "@/lib/services/learner";
import { formatDateTime } from "@/lib/utils";
import {
  CardListSkeleton,
  DemoChip,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";

export default function LearnerPurchasesPage() {
  const service = getLearnerService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listPurchases()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [selected, setSelected] = useState<PurchaseRecord | null>(null);

  return (
    <div>
      <PageHeader title="Purchase history" sub="Every order tied to your account, with receipts.">
        <DemoChip />
      </PageHeader>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={3} />
      ) : state.status === "error" ? (
        <FailedState
          title={state.error.code === "auth_required" ? "Sign in needed" : "Couldn't load purchases"}
          body={state.error.message}
          onRetry={reload}
        />
      ) : state.data.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="size-6 text-smoke" aria-hidden="true" />}
          title="No purchases yet"
          body="When you enrol in a course through a creator's link, the receipt appears here instantly."
        >
          <Button href="/@meera-shoots" variant="accent" size="sm">
            Visit the demo storefront
          </Button>
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-2.5">
            {state.data.map((purchase) => (
              <li key={purchase.id}>
                <button
                  type="button"
                  onClick={() => setSelected(purchase)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
                    <ReceiptText className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{purchase.courseTitle}</span>
                    <span className="block text-xs text-smoke">
                      {purchase.orderId} · {formatDateTime(purchase.placedAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-ink tabular-nums">
                      {formatINR(purchase.amountInPaise)}
                    </span>
                    <span className="inline-block rounded-full border-2 border-ink bg-lime/60 px-1.5 text-[9px] font-bold tracking-wide uppercase">
                      {purchase.status} (demo)
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-2xl border-2 border-dashed border-ink/40 bg-parchment/60 p-4 text-xs leading-relaxed text-smoke">
            Course purchases are non-refundable except where required by applicable law — there is
            no refund button by design.{" "}
            <Link href="/refund-policy" className="font-semibold text-accent underline underline-offset-2">
              Read the full purchase policy
            </Link>{" "}
            or{" "}
            <Link href="/learn/support" className="font-semibold text-accent underline underline-offset-2">
              contact support
            </Link>{" "}
            if you hit a problem. These are demo records, not real transactions.
          </p>
        </>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Receipt">
        {selected ? (
          <div className="space-y-4">
            <dl className="rounded-2xl border-2 border-ink bg-white p-4">
              <div className="flex justify-between border-b border-dashed border-ink/20 pb-2 text-sm">
                <dt className="text-smoke">Course</dt>
                <dd className="max-w-56 truncate font-semibold text-ink">{selected.courseTitle}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-ink/20 py-2 text-sm">
                <dt className="text-smoke">Order</dt>
                <dd className="font-mono text-xs text-ink">{selected.orderId}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-ink/20 py-2 text-sm">
                <dt className="text-smoke">Placed</dt>
                <dd className="font-semibold text-ink">{formatDateTime(selected.placedAt)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-sm">
                <dt className="font-semibold text-ink">Total paid</dt>
                <dd className="font-editorial text-2xl text-ink italic tabular-nums">
                  {formatINR(selected.amountInPaise)}
                </dd>
              </div>
            </dl>
            <p className="text-[11px] leading-relaxed text-smoke">
              Demo receipt — no real payment exists. In production this is the record emailed to you
              after a successful Razorpay payment, and real refunds are only ever actioned per the
              purchase policy.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
