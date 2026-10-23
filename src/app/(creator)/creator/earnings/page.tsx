"use client";

import { BadgePercent, IndianRupee, Landmark, LifeBuoy, Pencil, PiggyBank, Save, Wallet, X } from "lucide-react";
import { useState } from "react";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import type { PayoutDetails } from "@/lib/creator-types";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { formatDate } from "@/lib/utils";
import {
  CardListSkeleton,
  FailedState,
  PageHeader,
  StatCard,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

function maskAccount(accountNumber: string): string {
  if (!accountNumber) return "";
  return `•••• •••• ${accountNumber.slice(-4)}`;
}

export default function CreatorEarningsPage() {
  const toast = useToast();
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getEarnings()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const payoutQuery = useAsyncData(
    () =>
      service
        ? service.getPayoutDetails()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );

  const [stored, setStored] = useState<PayoutDetails | null>(null);
  const [draft, setDraft] = useState<{ accountNumber: string; ifsc: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<{ accountNumber?: string; ifsc?: string }>({});
  const [saving, setSaving] = useState(false);

  const fetched = payoutQuery.state.status === "success" ? payoutQuery.state.data : null;
  // Keep the just-saved values visible until the refetch lands.
  const saved = stored ?? fetched;
  const accountNumber = draft?.accountNumber ?? saved?.accountNumber ?? "";
  const ifsc = draft?.ifsc ?? saved?.ifsc ?? "";
  const showForm = editing || !saved?.accountNumber;

  const startEditing = () => {
    setDraft({ accountNumber: saved?.accountNumber ?? "", ifsc: saved?.ifsc ?? "" });
    setErrors({});
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(null);
    setErrors({});
    setEditing(false);
  };

  const setAccountNumber = (value: string) =>
    setDraft({ accountNumber: value, ifsc: draft?.ifsc ?? saved?.ifsc ?? "" });
  const setIfsc = (value: string) =>
    setDraft({ accountNumber: draft?.accountNumber ?? saved?.accountNumber ?? "", ifsc: value });

  const savePayoutDetails = async () => {
    if (!service) return;
    const nextErrors: typeof errors = {};
    if (!/^\d{9,18}$/.test(accountNumber.replace(/\s+/g, ""))) {
      nextErrors.accountNumber = "Enter 9–18 digits, no spaces.";
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      nextErrors.ifsc = "Format: 4 letters, 0, then 6 letters/numbers.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    const result = await service.updatePayoutDetails({ accountNumber, ifsc });
    setSaving(false);
    if (!result.ok) {
      const fieldErrors = result.error.fieldErrors;
      setErrors({
        accountNumber: fieldErrors?.accountNumber?.[0],
        ifsc: fieldErrors?.ifsc?.[0],
      });
      toast.push({ variant: "error", title: "Payout details not saved", description: result.error.message });
      return;
    }
    setStored(result.data);
    setDraft(null);
    setEditing(false);
    payoutQuery.reload();
    toast.push({
      variant: "success",
      title: "Payout details saved",
      description: "Platform administration uses these details for your payouts.",
    });
  };

  return (
    <div>
      <PageHeader
        title="Earnings"
        sub="Your money, transparently: gross, the 8% commission, your 92% share, and payout records."
      />

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={3} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<IndianRupee className="size-4.5" aria-hidden="true" />}
              label="Gross, all time"
              value={formatINR(state.data.summary.grossInPaise)}
            />
            <StatCard
              icon={<BadgePercent className="size-4.5" aria-hidden="true" />}
              label="Platform fees (8%)"
              value={formatINR(state.data.summary.platformFeesInPaise)}
            />
            <StatCard
              icon={<PiggyBank className="size-4.5" aria-hidden="true" />}
              label="Your share (92%)"
              value={formatINR(state.data.summary.creatorShareInPaise)}
            />
            <StatCard
              icon={<Wallet className="size-4.5" aria-hidden="true" />}
              label="Available balance"
              value={formatINR(state.data.summary.availableInPaise)}
              hint="Share minus recorded payouts"
            />
          </div>

          {/* Payout destination */}
          <section
            aria-labelledby="payout-details"
            className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="payout-details" className="flex items-center gap-2 text-base font-bold text-ink">
                <Landmark className="size-4.5 text-accent" aria-hidden="true" />
                Payout details
              </h2>
              {saved?.accountNumber && !editing ? (
                <Button size="sm" variant="outline" onClick={startEditing}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Change
                </Button>
              ) : null}
            </div>

            {payoutQuery.state.status === "loading" || payoutQuery.state.status === "idle" ? (
              <p className="mt-4 text-sm text-smoke">Loading your bank details…</p>
            ) : payoutQuery.state.status === "error" ? (
              <div className="mt-4">
                <FailedState
                  title="Couldn't load your payout details"
                  body={payoutQuery.state.error.message}
                  onRetry={payoutQuery.reload}
                />
              </div>
            ) : showForm ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs leading-relaxed text-smoke">
                  Add the Indian bank account where you want your earnings transferred. Only this
                  account is used for payouts.
                </p>
                <Field
                  id="payout-account"
                  label="Bank account number"
                  error={errors.accountNumber}
                  hint={errors.accountNumber ? undefined : "9–18 digits, no spaces or dashes."}
                >
                  <Input
                    id="payout-account"
                    value={accountNumber}
                    invalid={Boolean(errors.accountNumber)}
                    inputMode="numeric"
                    autoComplete="off"
                    onChange={(event) => {
                      setAccountNumber(event.target.value.replace(/[^\d\s]/g, ""));
                      setErrors((current) => ({ ...current, accountNumber: undefined }));
                    }}
                    placeholder="e.g. 50100234567890"
                    maxLength={23}
                  />
                </Field>
                <Field
                  id="payout-ifsc"
                  label="IFSC code"
                  error={errors.ifsc}
                  hint={errors.ifsc ? undefined : "Printed on your cheque book or bank app."}
                >
                  <Input
                    id="payout-ifsc"
                    value={ifsc}
                    invalid={Boolean(errors.ifsc)}
                    autoComplete="off"
                    onChange={(event) => {
                      setIfsc(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                      setErrors((current) => ({ ...current, ifsc: undefined }));
                    }}
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                  />
                </Field>
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="accent" onClick={savePayoutDetails} loading={saving}>
                    <Save className="size-4" aria-hidden="true" />
                    {saving ? "Saving…" : "Save payout details"}
                  </Button>
                  {saved?.accountNumber ? (
                    <Button variant="outline" disabled={saving} onClick={cancelEditing}>
                      <X className="size-4" aria-hidden="true" />
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3">
                  <dt className="text-xs font-bold tracking-wide text-smoke uppercase">
                    Bank account
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm font-bold text-ink">
                    {maskAccount(saved?.accountNumber ?? "")}
                  </dd>
                </div>
                <div className="rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3">
                  <dt className="text-xs font-bold tracking-wide text-smoke uppercase">IFSC</dt>
                  <dd className="mt-0.5 font-mono text-sm font-bold text-ink">{saved?.ifsc}</dd>
                </div>
                {saved?.updatedAt ? (
                  <p className="text-[11px] text-smoke sm:col-span-2">
                    Last updated {formatDate(saved.updatedAt)}.
                  </p>
                ) : null}
              </dl>
            )}
          </section>

          <section aria-labelledby="payouts" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="payouts" className="flex items-center gap-2 text-base font-bold text-ink">
                <Landmark className="size-4.5 text-accent" aria-hidden="true" />
                Payout records
              </h2>
            </div>
            {state.data.payouts.length === 0 ? (
              <p className="mt-4 rounded-xl border-2 border-dashed border-ink/30 bg-parchment/60 px-4 py-6 text-center text-sm text-smoke">
                No payouts recorded yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {state.data.payouts.map((payout) => (
                  <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 bg-cream p-4">
                    <div>
                      <p className="text-sm font-bold text-ink tabular-nums">{formatINR(payout.amountInPaise)}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-smoke">{payout.reference}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-full border-2 border-ink bg-lime/60 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                        Recorded · manual
                      </span>
                      <p className="mt-1 text-[11px] text-smoke">{formatDate(payout.recordedAt)}</p>
                    </div>
                    <p className="w-full text-xs text-smoke">{payout.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border-2 border-ink bg-ink p-5 text-cream shadow-hard-xs sm:p-6">
            <h2 className="text-base font-bold">How payouts work here</h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-cream/75">
              <li>
                · Sales settle through our payment partner, Razorpay; the 8% platform commission is
                split per successful eligible sale.
              </li>
              <li>
                · Payouts are recorded manually by platform administration under the intended
                payment arrangement, subject to provider approval and settlement timelines.
              </li>
              <li>
                · Keep your account number and IFSC up to date — payouts are transferred to the
                details saved above.
              </li>
            </ul>
            <Button href="/creator/support" variant="lime" size="sm" className="mt-5">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Ask about payouts
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
