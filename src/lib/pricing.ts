/**
 * Single source of truth for Beevo pricing (INR).
 *
 *  Pro monthly : **₹499 / month — GST (18 %) already INCLUDED**
 *                 ⤷ taxable base ₹422.88 + GST ₹76.12 = ₹499.00
 *  Pro annual  : ₹4,990 / year — GST included
 *                 ⤷ taxable base ₹4,228.81 + GST ₹761.19 = ₹4,990.00
 *
 * All money is computed in **paise** (integers). The customer-facing
 * total is FIXED — GST is decomposed from it, never added on top.
 */

export const GST_PERCENT = 18;

const TOTALS = {
  pro_monthly: { totalPaise: 49_900, months: 1, label: "Beevo Pro — Monthly" },
  pro_annual: { totalPaise: 499_000, months: 12, label: "Beevo Pro — Annual" },
} as const;

export const PRICING = TOTALS;

export type BillingCycle = "monthly" | "annual";

export function cycleKey(cycle: BillingCycle) {
  return cycle === "annual" ? ("pro_annual" as const) : ("pro_monthly" as const);
}

export interface PriceBreakdown {
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
  /** e.g. "₹422.88" */
  base: string;
  /** e.g. "₹76.12" */
  gst: string;
  /** e.g. "₹499.00" */
  total: string;
  months: number;
  label: string;
}

export function priceFor(cycle: BillingCycle): PriceBreakdown {
  const def = TOTALS[cycleKey(cycle)];
  // Decompose: total = base × (1 + GST) ⇒ base = round(total / 1.18)
  const basePaise = Math.round(def.totalPaise / (1 + GST_PERCENT / 100));
  const gstPaise = def.totalPaise - basePaise;
  return {
    basePaise,
    gstPaise,
    totalPaise: def.totalPaise,
    base: formatPaiseExact(basePaise),
    gst: formatPaiseExact(gstPaise),
    total: formatPaiseExact(def.totalPaise),
    months: def.months,
    label: def.label,
  };
}

/** Paise → rupee string ("₹499.00" with paise, "₹499" when whole). */
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

/** Always with paise — used for tax amounts. */
export function formatPaiseExact(paise: number): string {
  return (
    "₹" +
    (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
