"use client";

import { Check, Copy, Inbox, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { CourseStatus } from "@/lib/creator-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {sub ? <p className="mt-1 max-w-xl text-sm text-smoke">{sub}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

const STATUS_STYLES: Record<CourseStatus, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-parchment text-ink border-dashed" },
  published: { label: "Published", classes: "bg-lime text-ink" },
  unpublished: { label: "Unpublished", classes: "bg-sand text-ink" },
  archived: { label: "Archived", classes: "bg-smoke/15 text-smoke border-smoke/40" },
};

export function StatusChip({ status, className }: { status: CourseStatus; className?: string }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase",
        style.classes,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-xs", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-parchment">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="text-xs font-bold tracking-wide text-smoke uppercase">{label}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-smoke">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-ink/40 bg-parchment/60 px-6 py-12 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-white">
        {icon ?? <Inbox className="size-6 text-smoke" aria-hidden="true" />}
      </div>
      <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
      {body ? <p className="mx-auto mt-1.5 max-w-sm text-sm text-smoke">{body}</p> : null}
      {children ? <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}

export function FailedState({
  title = "Couldn't load this",
  body,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-3xl border-2 border-accent-deep bg-accent/5 px-6 py-12 text-center"
    >
      <h2 className="text-lg font-bold text-accent-deep">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-smoke">
        {body ?? "Something went wrong while talking to the service. Nothing was lost — try again."}
      </p>
      {onRetry ? (
        <Button onClick={onRetry} variant="accent" size="sm" className="mt-5">
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl border-2 border-ink/10 bg-ink/10", className)} />;
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

export function CopyButton({
  text,
  label = "Copy link",
  size = "sm",
  variant = "outline",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "outline" | "ink" | "lime" | "accent";
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.push({ variant: "success", title: "Copied to clipboard" });
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.push({
            variant: "error",
            title: "Couldn't copy",
            description: "Your browser blocked clipboard access — copy it manually.",
          });
        }
      }}
    >
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}
