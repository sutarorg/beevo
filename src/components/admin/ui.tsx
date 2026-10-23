"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminEvent } from "@/lib/admin-types";
import { formatINR } from "@/lib/domain";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/primitives";

export type PillTone = "lime" | "sand" | "accent" | "smoke" | "parchment" | "ink";

export function StatusPill({ label, tone = "parchment" }: { label: string; tone?: PillTone }) {
  const tones: Record<PillTone, string> = {
    lime: "bg-lime/70 text-ink border-ink",
    sand: "bg-sand text-ink border-ink/40",
    accent: "bg-accent text-cream border-ink",
    smoke: "bg-smoke/15 text-smoke border-smoke/40",
    parchment: "bg-parchment text-ink border-ink/30",
    ink: "bg-ink text-cream border-ink",
  };
  return (
    <span className={cn("inline-block rounded-full border-2 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase", tones[tone])}>
      {label}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-smoke" aria-hidden="true" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} className="pl-10" />
    </div>
  );
}

export function DetailRow({ label, mono = false, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-ink/15 py-2 text-sm last:border-0">
      <span className="shrink-0 text-smoke">{label}</span>
      <span className={cn("max-w-62 text-right font-semibold break-words text-ink", mono && "font-mono text-xs")}>{children}</span>
    </div>
  );
}

export function Money({ paise, signed = false, className }: { paise: number; signed?: boolean; className?: string }) {
  return (
    <span className={cn("tabular-nums", className)}>
      {signed ? (paise < 0 ? "−" : "+") : ""}
      {formatINR(Math.abs(paise))}
    </span>
  );
}

export function HistoryTimeline({ events, emptyLabel = "No history yet." }: { events: { id: string; at: string; actor: string; note?: string; action?: string; detail?: string }[]; emptyLabel?: string }) {
  if (events.length === 0) {
    return <p className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-xs text-smoke">{emptyLabel}</p>;
  }
  return (
    <ol className="space-y-2.5">
      {events.map((event) => (
        <li key={event.id} className="rounded-xl border-2 border-ink/10 bg-cream px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-ink">{event.actor}</p>
            <p className="shrink-0 text-[10px] font-semibold text-smoke">{formatDateTime(event.at)}</p>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-smoke">{event.note ?? event.detail ?? event.action}</p>
        </li>
      ))}
    </ol>
  );
}

export function EventIcon({ kind }: { kind: AdminEvent["kind"] }) {
  const map = {
    action: "bg-lime",
    system: "bg-sand",
    event: "bg-accent",
  } as const;
  return <span aria-hidden="true" className={cn("mt-1.5 inline-block size-2 shrink-0 rounded-full border border-ink", map[kind])} />;
}
