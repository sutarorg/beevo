/**
 * Single source of truth for Beevo pricing (INR).
 * All money is stored and computed in **paise** (integers) to avoid
 * floating-point drift, then formatted for display.
 *
 *   Pro monthly : ₹799.00 base + 18% GST ₹143.82 = ₹942.82
 *   Pro annual  : ₹7,990.00 base + 18% GST ₹1,438.20 = ₹9,428.20
 */

export const GST_PERCENT = 18;

export const PRICING = {
  pro_monthly: { basePaise: 79_900, months: 1, label: "Beevo Pro — Monthly" },
  pro_annual: { basePaise: 799_000, months: 12, label: "Beevo Pro — Annual" },
} as const;

export type BillingCycle = "monthly" | "annual";

export function cycleKey(cycle: BillingCycle) {
  return cycle === "annual" ? ("pro_annual" as const) : ("pro_monthly" as const);
}

/** GST in paise, rounded to the nearest paisa (banker-safe for our range). */
export function gstPaise(basePaise: number): number {
  return Math.round((basePaise * GST_PERCENT) / 100);
}

export interface PriceBreakdown {
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
  base: string;   // "₹799.00"
  gst: string;    // "₹143.82"
  total: string;  // "₹942.82"
  months: number;
  label: string;
}

export function priceFor(cycle: BillingCycle): PriceBreakdown {
  const def = PRICING[cycleKey(cycle)];
  const gst = gstPaise(def.basePaise);
  const total = def.basePaise + gst;
  return {
    basePaise: def.basePaise,
    gstPaise: gst,
    totalPaise: total,
    base: formatPaise(def.basePaise),
    gst: formatPaise(gst),
    total: formatPaise(total),
    months: def.months,
    label: def.label,
  };
}

/** Paise → "₹942.82" (always 2 decimals for tax-inclusive amounts). */
export function formatPaise(paise: number, opts: { decimals?: number } = {}): string {
  const rupees = paise / 100;
  const decimals = opts.decimals ?? (Number.isInteger(rupees) ? 0 : 2);
  return (
    "₹" +
    rupees.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

/** Display helper: "₹942.82" always with paise. */
export function formatPaiseExact(paise: number): string {
  return (
    "₹" +
    (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
