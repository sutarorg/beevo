"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "warning" | "neutral";
  requireReason?: boolean;
  reasonPlaceholder?: string;
  requireTypedPhrase?: string;
  summaryRows?: { label: string; value: string }[];
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  requireReason = false,
  reasonPlaceholder = "Document the operational reason for the audit log...",
  requireTypedPhrase,
  summaryRows,
  onClose,
  onConfirm,
}: AdminConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [typedPhrase, setTypedPhrase] = useState("");
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setTypedPhrase("");
      return;
    }
    closeBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const reasonSatisfied = !requireReason || reason.trim().length >= 6;
  const phraseSatisfied = !requireTypedPhrase || typedPhrase.trim() === requireTypedPhrase;
  const canConfirm = reasonSatisfied && phraseSatisfied;

  const confirmBtnClass =
    tone === "danger"
      ? "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-200 disabled:text-red-500"
      : tone === "warning"
        ? "bg-[#FFC928] text-beevo-ink hover:bg-[#F2B800] disabled:bg-beevo-border disabled:text-beevo-muted"
        : "bg-beevo-dark text-[#FFFDF7] hover:bg-[#2E2A25] disabled:bg-beevo-border disabled:text-beevo-muted";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      aria-describedby="admin-confirm-desc"
    >
      <div
        className="fixed inset-0 bg-[#171717]/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[480px] rounded-[12px] border border-beevo-border bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] ${
                tone === "danger"
                  ? "bg-red-50 text-red-700"
                  : "bg-beevo-cream text-beevo-honey-text"
              }`}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="admin-confirm-title"
                className="font-display text-[16px] font-extrabold text-beevo-ink"
              >
                {title}
              </h2>
              <p id="admin-confirm-desc" className="mt-1 text-[13px] leading-relaxed text-beevo-body">
                {description}
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close confirmation dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-beevo-muted hover:bg-beevo-canvas hover:text-beevo-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {summaryRows && summaryRows.length > 0 && (
          <dl className="mt-4 divide-y divide-beevo-border/80 rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3.5 py-1 text-[12.5px]">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2">
                <dt className="font-semibold text-beevo-muted">{row.label}</dt>
                <dd className="font-bold text-beevo-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {requireReason && (
          <div className="mt-4">
            <label
              htmlFor="admin-confirm-reason"
              className="block text-[12px] font-bold text-beevo-ink"
            >
              Audit Reason (required, min 6 characters)
            </label>
            <textarea
              id="admin-confirm-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="mt-1.5 w-full rounded-[8px] border border-beevo-border bg-beevo-canvas p-2.5 text-[13px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
            />
          </div>
        )}

        {requireTypedPhrase && (
          <div className="mt-4">
            <label
              htmlFor="admin-confirm-phrase"
              className="block text-[12px] font-bold text-beevo-ink"
            >
              Type <span className="font-mono font-extrabold">{requireTypedPhrase}</span> to confirm
            </label>
            <input
              id="admin-confirm-phrase"
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={requireTypedPhrase}
              className="mt-1.5 min-h-[42px] w-full rounded-[8px] border border-beevo-border bg-beevo-canvas px-3 text-[13px] font-bold text-beevo-ink"
            />
          </div>
        )}

        <p className="mt-3 text-[11.5px] text-beevo-muted">
          Every confirmed action generates an immutable entry in <span className="font-mono">/admin/audit-logs</span>.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-[8px] border border-beevo-border bg-white px-4 text-[13px] font-bold text-beevo-ink hover:bg-beevo-canvas"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(reason.trim())}
            className={`min-h-[42px] rounded-[8px] px-4 text-[13px] font-extrabold transition-colors disabled:cursor-not-allowed ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
