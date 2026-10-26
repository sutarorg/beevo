"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface Toast extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ push: (toast: ToastInput) => void } | null>(
  null,
);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, { classes: string; Icon: typeof Info }> = {
  success: { classes: "bg-moss text-lime border-ink", Icon: CheckCircle2 },
  error: { classes: "bg-accent-deep text-cream border-ink", Icon: AlertCircle },
  info: { classes: "bg-cream text-ink border-ink", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { ...input, id }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => {
          const { classes, Icon } = VARIANT_STYLES[toast.variant];
          return (
            <div
              key={toast.id}
              className={cn(
                "anim-rise-in pointer-events-auto flex items-start gap-3 rounded-2xl border-2 p-4 shadow-hard-sm",
                classes,
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-sm opacity-80">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-full p-1 transition-colors hover:bg-black/10"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
