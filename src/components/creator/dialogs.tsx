"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Shared modal shell: backdrop, escape close, mobile-sheet friendly.
 *
 * Rendered in a portal on document.body. This matters: the notification bell
 * (and therefore its dialog) is mounted inside the fixed app header, which
 * uses backdrop-filter — a backdrop-filter ancestor becomes the containing
 * block for `position: fixed`, so a non-portalled dialog was being trapped
 * inside the 56px header and appeared to overlap it. Portalling to <body>
 * keeps every dialog above the page, fully visible, wherever the trigger sits.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const dialog = (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] bg-ink/50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[76] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={cn(
                "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-2 border-ink bg-cream shadow-hard sm:rounded-3xl",
                wide ? "sm:max-w-2xl" : "sm:max-w-lg",
              )}
            >
              <div className="flex items-center justify-between border-b-2 border-ink bg-white px-5 py-3.5">
                <h2 className="text-base font-bold tracking-tight text-ink sm:text-lg">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="grid size-9 place-items-center rounded-full border-2 border-ink bg-cream transition-colors hover:bg-lime"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-5">{children}</div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );

  // Server render has no portal target; the dialog is closed then anyway.
  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="text-sm leading-relaxed text-smoke">{body}</div>
      <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={danger ? "accent" : "ink"}
          onClick={onConfirm}
          loading={loading}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
