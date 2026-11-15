"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { AdminApiError, AdminApiState } from "@/lib/admin-types";

interface AdminStatusGuardProps {
  state: AdminApiState;
  error?: AdminApiError;
  contextLabel?: string;
  compact?: boolean;
  onRetry?: () => void;
}

export function AdminStatusGuard({
  state,
  error,
  contextLabel = "Admin operational telemetry",
  compact = false,
  onRetry,
}: AdminStatusGuardProps) {
  if (state === "connected") return null;

  if (state === "unconfigured") {
    return (
      <div
        role="status"
        className={`flex flex-wrap items-start justify-between gap-3 rounded-[10px] border border-beevo-border bg-[#FAF8F2] ${
          compact ? "px-3.5 py-2.5" : "px-4 py-3"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text"
            aria-hidden="true"
          />
          <div className="text-[12.5px] leading-relaxed text-beevo-body">
            <span className="font-bold text-beevo-ink">
              Phase 3 Frontend Workspace &middot; Backend API Pending (Phase 4).
            </span>{" "}
            {contextLabel} is connected to strict zero-data adapters—no synthetic records,
            balances, or fabricated cost metrics are displayed. Server-side Supabase RBAC &amp;
            RLS enforce real admin access in Phase 4.
          </div>
        </div>
      </div>
    );
  }

  const configMap: Record<
    Exclude<AdminApiState, "connected" | "unconfigured">,
    {
      title: string;
      description: string;
      icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
      tone: string;
      ctaHref?: string;
      ctaLabel?: string;
    }
  > = {
    unauthorized: {
      title: "Authentication Required (401)",
      description:
        error?.message ||
        "You must sign in with a verified staff session before server endpoints will return admin data.",
      icon: Lock,
      tone: "border-amber-200 bg-amber-50/75 text-amber-950",
      ctaHref: "/login",
      ctaLabel: "Sign In",
    },
    forbidden: {
      title: "Access Denied — Insufficient Admin Permissions (403)",
      description:
        error?.message ||
        "Your authenticated account does not hold an authorized admin role verified by server-side RLS policies.",
      icon: ShieldAlert,
      tone: "border-red-200 bg-red-50/75 text-red-950",
      ctaHref: "/app",
      ctaLabel: "Return to Studio",
    },
    session_expired: {
      title: "Admin Session Expired",
      description:
        error?.message ||
        "Your verified session cookie expired. Re-authenticate to continue viewing sensitive operational records.",
      icon: Clock,
      tone: "border-amber-200 bg-amber-50/75 text-amber-950",
      ctaHref: "/login",
      ctaLabel: "Re-authenticate",
    },
    rate_limited: {
      title: "Rate Limit Reached (429)",
      description:
        error?.message ||
        `Too many admin API requests in a short window.${
          error?.retryAfterSeconds ? ` Try again in ${error.retryAfterSeconds}s.` : ""
        }`,
      icon: AlertTriangle,
      tone: "border-amber-200 bg-amber-50/75 text-amber-950",
    },
    error: {
      title: "Operational API Error",
      description:
        error?.message ||
        "The backend endpoint returned an unexpected error. Missing values remain unavailable rather than defaulting to zero.",
      icon: AlertTriangle,
      tone: "border-red-200 bg-red-50/75 text-red-950",
    },
  };

  const cfg = configMap[state];
  const Icon = cfg.icon;

  return (
    <div
      role="alert"
      className={`flex flex-col justify-between gap-3 rounded-[10px] border p-4 sm:flex-row sm:items-center ${cfg.tone}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden={true} />
        <div>
          <p className="font-display text-[14px] font-extrabold">{cfg.title}</p>
          <p className="mt-0.5 text-[13px] opacity-90">{cfg.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] border border-current/25 bg-white px-3.5 text-[12.5px] font-bold text-beevo-ink hover:bg-beevo-canvas"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        )}
        {cfg.ctaHref && cfg.ctaLabel && (
          <Link
            href={cfg.ctaHref}
            className="inline-flex min-h-[40px] items-center rounded-[8px] bg-beevo-dark px-4 text-[12.5px] font-bold text-[#FFFDF7]"
          >
            {cfg.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 4, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading operational records"
      className="overflow-hidden rounded-[10px] border border-beevo-border bg-white"
    >
      <div className="border-b border-beevo-border bg-[#FAF8F3] px-4 py-3">
        <div className="h-3.5 w-44 animate-pulse rounded bg-beevo-border" />
      </div>
      <div className="divide-y divide-beevo-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-3 px-4 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((__, c) => (
              <div key={c} className="h-3.5 animate-pulse rounded bg-beevo-border/75" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
