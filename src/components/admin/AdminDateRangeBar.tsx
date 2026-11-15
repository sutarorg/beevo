"use client";

import React from "react";
import { Calendar } from "lucide-react";
import {
  computeDateRange,
  type AdminDatePreset,
  type AdminDateRange,
} from "@/lib/admin-types";

interface AdminDateRangeBarProps {
  value: AdminDateRange;
  onChange: (next: AdminDateRange) => void;
}

const PRESETS: { id: AdminDatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "custom", label: "Custom period" },
];

export function AdminDateRangeBar({ value, onChange }: AdminDateRangeBarProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Date range presets"
        className="flex flex-wrap items-center gap-1 rounded-[10px] border border-beevo-border bg-white p-1"
      >
        {PRESETS.map((p) => {
          const active = value.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                onChange(
                  p.id === "custom"
                    ? { preset: "custom", from: value.from, to: value.to }
                    : computeDateRange(p.id)
                )
              }
              aria-pressed={active}
              className={`min-h-[36px] rounded-[7px] px-3 text-[12px] font-bold transition-colors ${
                active
                  ? "bg-beevo-dark text-[#FFFDF7]"
                  : "text-beevo-body hover:bg-beevo-canvas hover:text-beevo-ink"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        {value.preset === "custom" ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 font-semibold text-beevo-muted">
              <span>From</span>
              <input
                type="date"
                value={value.from}
                max={value.to}
                onChange={(e) =>
                  onChange({ preset: "custom", from: e.target.value, to: value.to })
                }
                className="min-h-[38px] rounded-[8px] border border-beevo-border bg-white px-2.5 font-mono text-[12px] text-beevo-ink"
              />
            </label>
            <label className="inline-flex items-center gap-1.5 font-semibold text-beevo-muted">
              <span>To</span>
              <input
                type="date"
                value={value.to}
                min={value.from}
                onChange={(e) =>
                  onChange({ preset: "custom", from: value.from, to: e.target.value })
                }
                className="min-h-[38px] rounded-[8px] border border-beevo-border bg-white px-2.5 font-mono text-[12px] text-beevo-ink"
              />
            </label>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-beevo-border bg-white px-3 py-1.5 font-mono text-[11.5px] font-semibold text-beevo-muted">
            <Calendar className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
            {value.from} &rarr; {value.to}
          </span>
        )}
      </div>
    </div>
  );
}
