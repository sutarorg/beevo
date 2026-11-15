"use client";

import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import type { ChartPoint } from "@/lib/admin-types";

interface AdminMetricChartProps {
  title: string;
  unit: string;
  dateRangeLabel: string;
  data: ChartPoint[];
  variant?: "line" | "bar" | "dual-bar";
  primaryLabel?: string;
  secondaryLabel?: string;
  emptyReason?: string;
}

export function AdminMetricChart({
  title,
  unit,
  dateRangeLabel,
  data,
  variant = "line",
  primaryLabel = "Value",
  secondaryLabel = "Failed",
  emptyReason = "Awaiting real backend time-series records from Phase 4.",
}: AdminMetricChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasData = data.length > 0;
  const maxVal = hasData
    ? Math.max(
        1,
        ...data.map((d) => Math.max(d.primary, d.secondary ?? 0))
      )
    : 1;

  const activePoint = activeIndex !== null ? data[activeIndex] ?? null : null;

  return (
    <article className="flex flex-col rounded-[12px] border border-beevo-border bg-white p-4 shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-[14px] font-extrabold tracking-[-0.015em] text-beevo-ink">
            {title}
          </h3>
          <p className="mt-0.5 text-[11.5px] font-semibold text-beevo-muted">
            Unit: <span className="text-beevo-body">{unit}</span>
          </p>
        </div>
        <span className="rounded-[6px] border border-beevo-border bg-[#FAF8F3] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-beevo-muted">
          {dateRangeLabel}
        </span>
      </div>

      {/* Accessible Legend for Dual Series */}
      {variant === "dual-bar" && (
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-beevo-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[#1B1916]" aria-hidden="true" />
            {primaryLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[#C53030]" aria-hidden="true" />
            {secondaryLabel}
          </span>
        </div>
      )}

      {/* Chart Area or Intentional Zero-Data State */}
      <div className="mt-3 flex-1">
        {!hasData ? (
          <div className="flex h-[156px] flex-col items-center justify-center rounded-[8px] border border-dashed border-beevo-border bg-[#FAF8F3]/70 px-4 text-center">
            <BarChart3 className="h-5 w-5 text-beevo-muted/70" aria-hidden="true" />
            <p className="mt-2 text-[12.5px] font-bold text-beevo-ink">No data for selected period</p>
            <p className="mt-0.5 max-w-[260px] text-[11.5px] leading-snug text-beevo-muted">
              {emptyReason}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Accessible Keyboard/Hover Tooltip Readout */}
            <div
              aria-live="polite"
              className="mb-1.5 flex min-h-[20px] items-center justify-between text-[11.5px] font-semibold tabular-nums text-beevo-muted"
            >
              {activePoint ? (
                <>
                  <span className="font-mono text-beevo-ink">{activePoint.date}</span>
                  <span>
                    {primaryLabel}: <strong className="text-beevo-ink">{activePoint.primary} {unit}</strong>
                    {activePoint.secondary !== undefined && (
                      <>
                        {" "}
                        &middot; {secondaryLabel}:{" "}
                        <strong className="text-red-700">{activePoint.secondary}</strong>
                      </>
                    )}
                  </span>
                </>
              ) : (
                <span>Hover or focus data points for exact values</span>
              )}
            </div>

            <svg
              viewBox="0 0 360 132"
              role="img"
              aria-label={`${title} chart in ${unit} for ${dateRangeLabel}`}
              className="h-[136px] w-full overflow-visible"
            >
              {/* Horizontal subtle reference gridlines */}
              {[0, 0.5, 1].map((ratio) => {
                const y = 110 - ratio * 94;
                return (
                  <line
                    key={ratio}
                    x1={0}
                    x2={360}
                    y1={y}
                    y2={y}
                    stroke="#ECE7DB"
                    strokeWidth={1}
                  />
                );
              })}

              {variant === "line" ? (
                <>
                  <polyline
                    fill="none"
                    stroke="#1B1916"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={data
                      .map((pt, i) => {
                        const x = data.length === 1 ? 180 : (i / (data.length - 1)) * 340 + 10;
                        const y = 110 - (pt.primary / maxVal) * 94;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  {data.map((pt, i) => {
                    const x = data.length === 1 ? 180 : (i / (data.length - 1)) * 340 + 10;
                    const y = 110 - (pt.primary / maxVal) * 94;
                    return (
                      <circle
                        key={pt.date}
                        cx={x}
                        cy={y}
                        r={activeIndex === i ? 5 : 3.5}
                        fill={activeIndex === i ? "#D99400" : "#1B1916"}
                        tabIndex={0}
                        aria-label={`${pt.date}: ${pt.primary} ${unit}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onFocus={() => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(null)}
                        onBlur={() => setActiveIndex(null)}
                        className="cursor-pointer outline-none"
                      />
                    );
                  })}
                </>
              ) : (
                data.map((pt, i) => {
                  const slot = 340 / Math.max(1, data.length);
                  const x = 10 + i * slot;
                  const h1 = (pt.primary / maxVal) * 94;
                  const barW = variant === "dual-bar" ? Math.max(4, slot * 0.36) : Math.max(6, slot * 0.56);
                  const h2 = pt.secondary ? (pt.secondary / maxVal) * 94 : 0;
                  return (
                    <g
                      key={pt.date}
                      tabIndex={0}
                      aria-label={`${pt.date}: ${pt.primary} ${unit}`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onFocus={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onBlur={() => setActiveIndex(null)}
                      className="cursor-pointer outline-none"
                    >
                      <rect
                        x={x + 2}
                        y={110 - h1}
                        width={barW}
                        height={Math.max(1, h1)}
                        rx={2}
                        fill={activeIndex === i ? "#D99400" : "#1B1916"}
                      />
                      {variant === "dual-bar" && (
                        <rect
                          x={x + barW + 4}
                          y={110 - h2}
                          width={barW}
                          height={Math.max(1, h2)}
                          rx={2}
                          fill="#C53030"
                        />
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>
        )}
      </div>
    </article>
  );
}
