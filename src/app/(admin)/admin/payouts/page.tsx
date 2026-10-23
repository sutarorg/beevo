"use client";

import { Ban, CircleAlert, Landmark, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CreatorEarningsRow, PayoutRecordAdmin, PayoutStatus } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService, type AdminService } from "@/lib/services/admin";
import { formatDate, formatDateTime } from "@/lib/utils";
import { DetailRow, HistoryTimeline, SearchInput, StatusPill, type PillTone } from "@/components/admin/ui";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

const TONE: Record<PayoutStatus, PillTone> = {
  pending: "sand",
  recorded: "lime",
  failed: "accent",
  cancelled: "smoke",
};

export default function AdminPayoutsPage() {
  const toast = useToast();
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listPayouts()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PayoutRecordAdmin | null>(null);
  const [creating, setCreating] = useState(false);
  const [failing, setFailing] = useState<{ payout: PayoutRecordAdmin; mode: "failed" | "cancelled" } | null>(null);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((payout) => {
      if (statusFilter !== "all" && payout.status !== statusFilter) return false;
      if (!query) return true;
      return [payout.id, payout.creatorName, payout.handle, payout.transferRef ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [state, search, statusFilter]);

  const refreshSelected = async (id: string) => {
    if (!service) return;
    const list = await service.listPayouts();
    if (list.ok) {
      const updated = list.data.find((payout) => payout.id === id);
      if (updated) setSelected(updated);
    }
  };

  return (
    <div>
      <PageHeader
        title="Payouts"
        sub="Manual payout records: create → transfer at the bank → record the reference. Nothing moves money here."
      >
        <Button variant="accent" size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden="true" />
          New payout record
        </Button>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search payout, creator, reference…" label="Search payouts" />
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "recorded", "failed", "cancelled"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold capitalize transition-colors ${statusFilter === value ? "border-ink bg-ink text-cream" : "border-ink bg-white text-ink hover:bg-parchment"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={4} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Landmark className="size-6 text-smoke" aria-hidden="true" />}
          title="No payout records in this view"
          body="Create a payout record once a creator has outstanding earnings."
        >
          <Button size="sm" variant="accent" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New payout record
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((payout) => (
            <li key={payout.id}>
              <button
                type="button"
                onClick={() => setSelected(payout)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${payout.status === "recorded" ? "bg-lime" : payout.status === "failed" ? "bg-accent text-cream" : "bg-parchment"}`}>
                  <Landmark className="size-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-ink">{payout.creatorName}</span>
                    <StatusPill label={payout.status} tone={TONE[payout.status]} />
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    <span className="font-mono">{payout.id}</span> · {payout.beneficiaryMasked}
                    {payout.transferRef ? ` · ${payout.transferRef}` : " · ref pending"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-ink tabular-nums">{formatINR(payout.amountInPaise)}</span>
                  <span className="text-[10px] text-smoke">created {formatDate(payout.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <PayoutDetail
          payout={selected}
          service={service}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await reload();
            await refreshSelected(selected.id);
          }}
          onFailOrCancel={(mode) => setFailing({ payout: selected, mode })}
        />
      ) : null}

      {creating ? (
        <CreatePayoutModal
          service={service}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await reload();
          }}
        />
      ) : null}

      {failing ? (
        <FailCancelModal
          payout={failing.payout}
          mode={failing.mode}
          service={service}
          onClose={() => setFailing(null)}
          onDone={async () => {
            setFailing(null);
            await reload();
            await refreshSelected(failing.payout.id);
          }}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail + recording form
// ---------------------------------------------------------------------------

function PayoutDetail({
  payout,
  service,
  onClose,
  onChanged,
  onFailOrCancel,
}: {
  payout: PayoutRecordAdmin;
  service: AdminService | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onFailOrCancel: (mode: "failed" | "cancelled") => void;
}) {
  const toast = useToast();
  const [transferRef, setTransferRef] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [refError, setRefError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(false);
  const [earnings, setEarnings] = useState<CreatorEarningsRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (service) {
      void service.getCreatorEarningsDetail(payout.creatorId).then((result) => {
        if (!cancelled && result.ok) setEarnings(result.data.summary);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [service, payout.creatorId]);

  const validate = (): boolean => {
    const refOk = transferRef.trim().length >= 6;
    const dateOk = Boolean(transferDate) && !Number.isNaN(Date.parse(transferDate)) && Date.parse(transferDate) <= Date.now() + 86_400_000;
    setRefError(refOk ? null : "Enter the actual bank / UTR reference (at least 6 characters).");
    setDateError(dateOk ? null : "Enter a valid transfer date (not in the future).");
    return refOk && dateOk;
  };

  const record = async () => {
    if (!service) return;
    setRecording(true);
    const result = await service.recordPayout(payout.id, transferRef, transferDate);
    setRecording(false);
    setConfirmRecord(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't record the payout", description: result.error.message });
      return;
    }
    toast.push({
      variant: "success",
      title: "Payout recorded",
      description: `${transferRef.trim()} is now attached to ${payout.id} and written to the audit log.`,
    });
    await onChanged();
    onClose();
  };

  const fieldsReady = transferRef.trim().length >= 6 && Boolean(transferDate);

  return (
    <Modal open onClose={onClose} title={`Payout ${payout.id}`} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-editorial text-4xl text-ink italic tabular-nums">{formatINR(payout.amountInPaise)}</p>
            <p className="text-sm font-semibold text-ink">{payout.creatorName} · @{payout.handle}</p>
          </div>
          <StatusPill label={payout.status} tone={TONE[payout.status]} />
        </div>

        {earnings ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ["Payable earnings", formatINR(earnings.payableInPaise)],
              ["Paid out", formatINR(earnings.paidOutInPaise)],
              ["Outstanding", formatINR(earnings.outstandingInPaise)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
                <p className="text-sm font-bold text-ink tabular-nums">{value}</p>
                <p className="text-[10px] font-bold tracking-wide text-smoke uppercase">{label}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div>
          <DetailRow label="Beneficiary (masked)">{payout.beneficiaryMasked}</DetailRow>
          <DetailRow label="Transfer reference" mono>{payout.transferRef ?? "— not recorded —"}</DetailRow>
          <DetailRow label="Transfer date">{payout.transferDate ?? "— not recorded —"}</DetailRow>
          <DetailRow label="Created">{formatDateTime(payout.createdAt)}</DetailRow>
          <DetailRow label="Recorded by">{payout.recordedBy ?? "—"}</DetailRow>
          <DetailRow label="Note">{payout.note}</DetailRow>
        </div>

        {/* Recording form — strict, explicit, never automatic */}
        {payout.status === "pending" ? (
          <div className="rounded-2xl border-2 border-ink bg-parchment/70 p-4">
            <p className="text-sm font-bold text-ink">Record the bank transfer</p>
            <p className="mt-1 text-xs leading-relaxed text-smoke">
              Do the actual transfer at your bank first — this form only <em>records</em> its
              reference. Filling it is the only way a payout becomes “recorded”; viewing this page
              or closing dialogs never marks anything paid.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field id="payout-ref" label="Bank / UTR transfer reference" error={refError ?? undefined}>
                <Input
                  id="payout-ref"
                  value={transferRef}
                  invalid={Boolean(refError)}
                  onChange={(event) => {
                    setTransferRef(event.target.value);
                    if (event.target.value.trim().length >= 6) setRefError(null);
                  }}
                  placeholder="e.g. UTR N402117655"
                />
              </Field>
              <Field id="payout-date" label="Transfer date" error={dateError ?? undefined}>
                <Input
                  id="payout-date"
                  type="date"
                  value={transferDate}
                  invalid={Boolean(dateError)}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => {
                    setTransferDate(event.target.value);
                    setDateError(null);
                  }}
                />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="ink"
                size="sm"
                disabled={!fieldsReady}
                onClick={() => {
                  if (validate()) setConfirmRecord(true);
                }}
              >
                Record payout
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFailOrCancel("failed")}>
                <CircleAlert className="size-4" aria-hidden="true" />
                Mark as failed
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFailOrCancel("cancelled")}>
                <Ban className="size-4" aria-hidden="true" />
                Cancel record
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-smoke">
              “Record payout” stays disabled until a reference and date are entered.
            </p>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Action history</p>
          <div className="mt-2">
            <HistoryTimeline events={payout.history} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t-2 border-ink/10 pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRecord}
        title="Record this payout as transferred?"
        body={
          <>
            You are confirming that a bank transfer of{" "}
            <span className="font-semibold text-ink">{formatINR(payout.amountInPaise)}</span> was
            made to <span className="font-semibold text-ink">{payout.beneficiaryMasked}</span> with
            reference <span className="font-mono text-xs">{transferRef.trim()}</span> dated{" "}
            <span className="font-semibold text-ink">{transferDate}</span>. This writes to the audit
            log and moves the amount from “outstanding” to “paid out” in the ledger.
          </>
        }
        confirmLabel="Confirm — transfer was made"
        loading={recording}
        onConfirm={record}
        onCancel={() => setConfirmRecord(false)}
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Create payout record
// ---------------------------------------------------------------------------

function CreatePayoutModal({
  service,
  onClose,
  onCreated,
}: {
  service: AdminService | null;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const toast = useToast();
  const { state } = useAsyncData(
    () =>
      service
        ? service.getCreatorEarnings()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [creatorId, setCreatorId] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = state.status === "success" ? state.data : [];
  const selected = rows.find((row) => row.creatorId === creatorId) ?? null;

  useEffect(() => {
    if (selected) setAmountRupees((selected.outstandingInPaise / 100).toString());
  }, [selected]);

  const create = async () => {
    if (!service || !selected) return;
    const paise = Math.round(Number(amountRupees) * 100);
    if (!Number.isFinite(paise) || paise <= 0) {
      setError("Enter an amount above ₹0.");
      return;
    }
    if (paise > selected.outstandingInPaise) {
      setError(`That exceeds the outstanding balance (${formatINR(selected.outstandingInPaise)}).`);
      return;
    }
    setCreating(true);
    const result = await service.createPayout(selected.creatorId, paise);
    setCreating(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't create the record", description: result.error.message });
      return;
    }
    toast.push({
      variant: "success",
      title: "Payout record created (pending)",
      description: "It becomes “recorded” only after a transfer reference is entered.",
    });
    await onCreated();
  };

  return (
    <Modal open onClose={onClose} title="New payout record">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-smoke">
          A pending record tracks that a creator is owed a manual transfer. The transfer itself
          happens at the bank — then you record its reference back here.
        </p>
        <Field id="new-payout-creator" label="Creator">
          <select
            id="new-payout-creator"
            value={creatorId}
            onChange={(event) => setCreatorId(event.target.value)}
            className="w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm font-semibold text-ink"
          >
            <option value="">Choose a creator…</option>
            {rows
              .filter((row) => row.outstandingInPaise > 0)
              .map((row) => (
                <option key={row.creatorId} value={row.creatorId}>
                  {row.creatorName} — outstanding {formatINR(row.outstandingInPaise)}
                </option>
              ))}
          </select>
        </Field>
        {rows.filter((row) => row.outstandingInPaise > 0).length === 0 && state.status === "success" ? (
          <p className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">
            No creator has an outstanding balance right now.
          </p>
        ) : null}
        <Field id="new-payout-amount" label={`Amount (INR)${selected ? ` — up to ${formatINR(selected.outstandingInPaise)}` : ""}`} error={error ?? undefined}>
          <Input
            id="new-payout-amount"
            inputMode="decimal"
            value={amountRupees}
            invalid={Boolean(error)}
            disabled={!selected}
            onChange={(event) => {
              setAmountRupees(event.target.value.replace(/[^0-9.]/g, ""));
              setError(null);
            }}
            placeholder="0"
          />
        </Field>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button variant="accent" onClick={create} loading={creating} disabled={!selected || !amountRupees}>
            Create pending record
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Mark failed / cancelled
// ---------------------------------------------------------------------------

function FailCancelModal({
  payout,
  mode,
  service,
  onClose,
  onDone,
}: {
  payout: PayoutRecordAdmin;
  mode: "failed" | "cancelled";
  service: AdminService | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const run = async () => {
    if (!service) return;
    setActing(true);
    const result = await service.setPayoutStatus(payout.id, mode, note);
    setActing(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Action failed", description: result.error.message });
      return;
    }
    toast.push({
      variant: "info",
      title: mode === "failed" ? "Payout marked failed" : "Payout cancelled",
      description: "Written to the action history and audit log.",
    });
    await onDone();
  };

  return (
    <Modal open onClose={onClose} title={mode === "failed" ? "Mark payout as failed?" : "Cancel this payout record?"}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-smoke">
          {mode === "failed"
            ? `Use this when the bank returned or rejected the transfer for ${payout.creatorName} (${formatINR(payout.amountInPaise)}). The amount returns to outstanding.`
            : `Cancelling voids this pending record for ${payout.creatorName} (${formatINR(payout.amountInPaise)}). The amount stays outstanding for a future record.`}
        </p>
        <Field id="payout-status-note" label="Note for the audit log (required)">
          <textarea
            id="payout-status-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder={mode === "failed" ? "e.g. Bank returned the transfer — IFSC mismatch" : "e.g. Duplicate record created by mistake"}
            className="w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
          />
        </Field>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={acting}>
            Back
          </Button>
          <Button variant="accent" onClick={run} loading={acting} disabled={!note.trim()}>
            {mode === "failed" ? "Mark failed" : "Cancel record"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
