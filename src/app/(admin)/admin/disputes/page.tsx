"use client";

import { Gavel, Scale, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { DisputeRecord, DisputeStatus, DisputeType } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService, type AdminService } from "@/lib/services/admin";
import { formatDate, formatDateTime } from "@/lib/utils";
import { DetailRow, HistoryTimeline, StatusPill, type PillTone } from "@/components/admin/ui";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { ConfirmDialog, Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

const TYPE_TONE: Record<DisputeType, PillTone> = {
  chargeback: "accent",
  dispute: "sand",
  reversal: "ink",
  legal_exception: "accent",
};

const STATUS_TONE: Record<DisputeStatus, PillTone> = {
  open: "accent",
  under_review: "sand",
  resolved: "lime",
};

const TYPE_LABEL: Record<DisputeType, string> = {
  chargeback: "Chargeback",
  dispute: "Payment dispute",
  reversal: "Reversal",
  legal_exception: "Legal exception",
};

export default function AdminDisputesPage() {
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listDisputes()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [selected, setSelected] = useState<DisputeRecord | null>(null);

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    return state.data.filter((dispute) => statusFilter === "all" || dispute.status === statusFilter);
  }, [state, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Disputes & exceptions"
        sub="Chargebacks, reversals, and legally required exceptions. There is no standard refund flow — by design."
      >
      </PageHeader>

      <div className="mb-5 rounded-2xl border-2 border-ink bg-parchment/70 p-4 text-xs leading-relaxed text-smoke">
        <p>
          <span className="font-bold text-ink">How cases work here:</span> course purchases are
          non-refundable by default. Cases in this queue are provider-initiated (chargebacks,
          failed-settlement reversals) or situations where applicable law may require a remedy —
          each is investigated and resolved by an admin, with notes on record.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "open", "under_review", "resolved"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            aria-pressed={statusFilter === value}
            className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold capitalize transition-colors ${statusFilter === value ? "border-ink bg-ink text-cream" : "border-ink bg-white text-ink hover:bg-parchment"}`}
          >
            {value.replace("_", " ")}
          </button>
        ))}
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={3} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="size-6 text-smoke" aria-hidden="true" />}
          title="No cases in this view"
          body="Chargebacks and legal-exception cases appear here when the provider or a buyer raises one."
        >
          <Button size="sm" variant="outline" onClick={() => setStatusFilter("all")}>
            Show all
          </Button>
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((dispute) => (
            <li key={dispute.id}>
              <button
                type="button"
                onClick={() => setSelected(dispute)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-left shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${dispute.status === "resolved" ? "bg-lime" : "bg-accent text-cream"}`}>
                  {dispute.type === "legal_exception" ? (
                    <Scale className="size-4.5" aria-hidden="true" />
                  ) : (
                    <Gavel className="size-4.5" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-ink">{TYPE_LABEL[dispute.type]}</span>
                    <StatusPill label={dispute.status.replace("_", " ")} tone={STATUS_TONE[dispute.status]} />
                  </span>
                  <span className="block truncate text-xs text-smoke">
                    {dispute.courseTitle} · {dispute.learnerName} · opened {formatDate(dispute.openedAt)}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm font-bold text-ink tabular-nums">
                  {formatINR(dispute.amountInPaise)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && service ? (
        <DisputeDetail
          dispute={selected}
          service={service}
          onClose={() => setSelected(null)}
          onChanged={async (updated) => {
            setSelected(updated);
            await reload();
          }}
        />
      ) : null}
    </div>
  );
}

function DisputeDetail({
  dispute,
  service,
  onClose,
  onChanged,
}: {
  dispute: DisputeRecord;
  service: AdminService;
  onClose: () => void;
  onChanged: (updated: DisputeRecord) => Promise<void>;
}) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<DisputeStatus | null>(null);
  const [changing, setChanging] = useState(false);

  const addNote = async () => {
    setAddingNote(true);
    const result = await service.addDisputeNote(dispute.id, note);
    setAddingNote(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't add the note", description: result.error.message });
      return;
    }
    setNote("");
    toast.push({ variant: "success", title: "Note added", description: "It’s on the case record and in the audit log." });
    await onChanged(result.data);
  };

  const changeStatus = async () => {
    if (!confirmStatus) return;
    setChanging(true);
    const result = await service.setDisputeStatus(dispute.id, confirmStatus);
    setChanging(false);
    setConfirmStatus(null);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't change status", description: result.error.message });
      return;
    }
    toast.push({ variant: "success", title: "Case updated", description: `Status is now ${confirmStatus.replace("_", " ")}.` });
    await onChanged(result.data);
  };

  const nextStatuses: { status: DisputeStatus; label: string }[] = [];
  if (dispute.status === "open") {
    nextStatuses.push({ status: "under_review", label: "Start review" });
  }
  if (dispute.status !== "resolved") {
    nextStatuses.push({ status: "resolved", label: "Mark resolved" });
  }

  return (
    <Modal open onClose={onClose} title={`${TYPE_LABEL[dispute.type]} — ${dispute.id}`} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusPill label={dispute.status.replace("_", " ")} tone={STATUS_TONE[dispute.status]} />
          <p className="font-editorial text-3xl text-ink italic tabular-nums">{formatINR(dispute.amountInPaise)}</p>
        </div>

        <div>
          <DetailRow label="Order" mono>{dispute.orderId}</DetailRow>
          <DetailRow label="Course">{dispute.courseTitle}</DetailRow>
          <DetailRow label="Learner">{dispute.learnerName}</DetailRow>
          <DetailRow label="Creator">{dispute.creatorName}</DetailRow>
          <DetailRow label="Opened">{formatDateTime(dispute.openedAt)}</DetailRow>
        </div>

        <div className="rounded-2xl border-2 border-ink bg-parchment/70 p-4">
          <p className="text-xs font-bold tracking-wide text-smoke uppercase">Summary</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{dispute.summary}</p>
        </div>

        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">
            Investigation notes ({dispute.notes.length})
          </p>
          <div className="mt-2">
            <HistoryTimeline events={dispute.notes} />
          </div>
          {dispute.status !== "resolved" ? (
            <div className="mt-3 space-y-2">
              <Field id="dispute-note" label="Add an investigation note">
                <textarea
                  id="dispute-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  placeholder="What did you check? What happens next?"
                  className="w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
                />
              </Field>
              <Button size="sm" variant="outline" onClick={addNote} loading={addingNote} disabled={!note.trim()}>
                Add note
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t-2 border-ink/10 pt-4">
          {nextStatuses.map((next) => (
            <Button
              key={next.status}
              size="sm"
              variant={next.status === "resolved" ? "ink" : "accent"}
              onClick={() => setConfirmStatus(next.status)}
            >
              {next.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmStatus !== null}
        title={confirmStatus === "resolved" ? "Resolve this case?" : "Move this case to under review?"}
        body={
          confirmStatus === "resolved" ? (
            <>
              Resolution is recorded with your note trail in the audit log. Any money movement is a
              separate provider action — resolving here tracks the decision, not the transfer.
            </>
          ) : (
            "The case is marked as actively investigated."
          )
        }
        confirmLabel={confirmStatus === "resolved" ? "Mark resolved" : "Start review"}
        loading={changing}
        onConfirm={changeStatus}
        onCancel={() => setConfirmStatus(null)}
      />
    </Modal>
  );
}
