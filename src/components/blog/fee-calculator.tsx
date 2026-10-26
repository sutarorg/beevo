"use client";

import { IndianRupee } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { PLATFORM_COMMISSION_LABEL } from "@/lib/domain";

/**
 * Fee calculator used inside comparison articles.
 *
 * Rates are the *published* ones, checked 26 October 2026, and are stated in
 * the panel itself. The point is not to make Beevo look cheap — it is to show
 * that a platform's percentage is only one of three deductions, and that GST
 * on the fee is the line everyone forgets.
 *
 *   Beevo        — 8% platform commission (gateway charges separate)
 *   Instamojo    — digital goods 5% + ₹3, regular 2% + ₹3, +18% GST on the fee
 *   Gateway only — 2% + 18% GST, and you build delivery yourself
 */

const BEEVO_RATE = 0.08;
const INSTAMOJO_DIGITAL = { rate: 0.05, flat: 3 };
const INSTAMOJO_REGULAR = { rate: 0.02, flat: 3 };
const GATEWAY_ONLY = { rate: 0.02, flat: 0 };
const GST_RATE = 0.18;

const rupee = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));

interface Row {
  id: string;
  label: string;
  fee: number;
  keep: number;
  note: string;
  tone: "accent" | "plain";
}

function feeWithGst(price: number, rate: number, flat: number): number {
  const base = price * rate + flat;
  return base * (1 + GST_RATE);
}

export function FeeCalculator() {
  const priceId = useId();
  const [price, setPrice] = useState(1499);

  const rows = useMemo<Row[]>(() => {
    const beevaFee = price * BEEVO_RATE;
    const instamojoDigitalFee = feeWithGst(price, INSTAMOJO_DIGITAL.rate, INSTAMOJO_DIGITAL.flat);
    const instamojoRegularFee = feeWithGst(price, INSTAMOJO_REGULAR.rate, INSTAMOJO_REGULAR.flat);
    const gatewayFee = feeWithGst(price, GATEWAY_ONLY.rate, GATEWAY_ONLY.flat);

    return [
      {
        id: "beevo",
        label: "Beevo",
        fee: beevaFee,
        keep: price - beevaFee,
        note: `${PLATFORM_COMMISSION_LABEL} platform commission · gateway charges settled separately`,
        tone: "accent",
      },
      {
        id: "instamojo-digital",
        label: "Instamojo · digital goods",
        fee: instamojoDigitalFee,
        keep: price - instamojoDigitalFee,
        note: "5% + ₹3, plus 18% GST on the fee",
        tone: "plain",
      },
      {
        id: "instamojo-regular",
        label: "Instamojo · regular products",
        fee: instamojoRegularFee,
        keep: price - instamojoRegularFee,
        note: "2% + ₹3, plus 18% GST on the fee",
        tone: "plain",
      },
      {
        id: "gateway",
        label: "Gateway only (you deliver)",
        fee: gatewayFee,
        keep: price - gatewayFee,
        note: "≈2% + 18% GST — but access control and receipts are yours to build",
        tone: "plain",
      },
    ];
  }, [price]);

  const best = rows.reduce((a, b) => (a.keep >= b.keep ? a : b));

  return (
    <section
      aria-labelledby="fee-calculator-heading"
      className="my-10 rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-sm sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-hard-xs">
          <IndianRupee className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id="fee-calculator-heading"
            className="text-lg font-bold tracking-tight text-ink sm:text-xl"
          >
            What lands in your account?
          </h2>
          <p className="text-xs text-smoke">Move the slider to your course price.</p>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor={priceId} className="text-sm font-semibold text-ink">
          Course price: <span className="font-editorial text-2xl italic">{rupee(price)}</span>
        </label>
        <input
          id={priceId}
          type="range"
          min={199}
          max={9999}
          step={100}
          value={price}
          onChange={(event) => setPrice(Number(event.target.value))}
          aria-describedby={`${priceId}-help`}
          className="slider-accent mt-3 w-full"
        />
        <p id={`${priceId}-help`} className="mt-1 text-xs text-smoke">
          Between ₹199 and ₹9,999. Round numbers are intentional — they behave like real prices.
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {rows.map((row) => {
          const share = Math.max(0, Math.min(100, (row.keep / price) * 100));
          return (
            <li
              key={row.id}
              className={
                row.tone === "accent"
                  ? "rounded-2xl border-2 border-ink bg-lime/20 p-3.5"
                  : "rounded-2xl border-2 border-ink/12 bg-cream/50 p-3.5"
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-bold text-ink">{row.label}</p>
                <p className="text-sm text-ink">
                  <span className="font-bold">{rupee(row.keep)}</span>{" "}
                  <span className="text-smoke">
                    kept · fees {rupee(row.fee)}
                  </span>
                </p>
              </div>
              <div
                aria-hidden="true"
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full border border-ink/15 bg-white"
              >
                <div
                  className={row.tone === "accent" ? "h-full bg-accent-deep" : "h-full bg-ink/40"}
                  style={{ width: `${share}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-smoke">{row.note}</p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 rounded-xl border border-ink/15 bg-parchment/60 p-3 text-xs leading-relaxed text-smoke">
        At {rupee(price)}, the largest payout is {rupee(best.keep)} on{" "}
        <span className="font-semibold text-ink">{best.label}</span>. Published rates, checked 26
        October 2026: Beevo 8% platform commission; Instamojo 5% + ₹3 (digital) and 2% + ₹3
        (regular), excluding GST, which it charges at 18% on the fee; a standard Indian gateway
        around 2% + 18% GST. Illustrative only — confirm current rates with each provider before
        deciding.
      </p>
    </section>
  );
}
