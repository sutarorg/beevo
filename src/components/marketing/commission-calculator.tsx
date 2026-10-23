"use client";

import { useState } from "react";
import { commissionBreakdown, formatINR } from "@/lib/domain";
import { cn } from "@/lib/utils";

const PRESETS = [499, 999, 1499, 2499];

/**
 * Interactive 8% commission explainer. Purely illustrative — gateway charges
 * and taxes settle separately, and nothing here is an earnings promise.
 */
export function CommissionCalculator() {
  const [priceRupees, setPriceRupees] = useState(999);
  const split = commissionBreakdown(priceRupees * 100);

  return (
    <div className="rounded-3xl border-2 border-ink bg-ink p-6 text-cream shadow-hard sm:p-8">
      <p className="text-xs font-bold tracking-[0.22em] text-lime uppercase">
        Try the maths
      </p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Drag the price. Watch the split.
      </h3>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPriceRupees(preset)}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors",
              priceRupees === preset
                ? "border-lime bg-lime text-ink"
                : "border-cream/30 text-cream/70 hover:border-cream hover:text-cream",
            )}
          >
            {formatINR(preset * 100)}
          </button>
        ))}
      </div>

      <label
        htmlFor="course-price"
        className="mt-6 block text-sm font-semibold text-cream/80"
      >
        Course price
      </label>
      <input
        id="course-price"
        type="range"
        min={99}
        max={4999}
        step={50}
        value={priceRupees}
        onChange={(event) => setPriceRupees(Number(event.target.value))}
        aria-valuetext={formatINR(priceRupees * 100)}
        className="slider-accent mt-2 w-full"
      />

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-cream/60 uppercase">
            Buyer pays
          </p>
          <p className="font-editorial text-4xl italic tabular-nums sm:text-5xl">
            {formatINR(split.grossInPaise)}
          </p>
        </div>
      </div>

      <div
        className="mt-5 flex h-5 overflow-hidden rounded-full border-2 border-cream"
        role="img"
        aria-label={`Split: 92% creator, 8% platform`}
      >
        <div className="bg-lime" style={{ width: "92%" }} />
        <div className="bg-accent" style={{ width: "8%" }} />
      </div>

      <dl className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block size-3 rounded-full bg-lime" aria-hidden="true" />
            You keep (92%)
          </dt>
          <dd className="text-lg font-bold text-lime tabular-nums">
            {formatINR(split.creatorShareInPaise, { decimals: true })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block size-3 rounded-full bg-accent" aria-hidden="true" />
            Beevo fee (8%)
          </dt>
          <dd className="text-lg font-bold text-cream tabular-nums">
            {formatINR(split.platformFeeInPaise, { decimals: true })}
          </dd>
        </div>
      </dl>

      <p className="mt-6 rounded-xl bg-cream/10 p-3 text-xs leading-relaxed text-cream/60">
        Illustrative only. Excludes payment-gateway charges and applicable taxes,
        which are settled separately per the payment provider&apos;s terms. This is
        not a projection, promise, or guarantee of earnings or payouts.
      </p>
    </div>
  );
}
