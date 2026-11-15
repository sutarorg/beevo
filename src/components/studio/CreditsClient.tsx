"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Coins,
  Info,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PRICING_PACKS } from "@/lib/beevo-data";
import type { BackendConnectionState, CreditWallet } from "@/lib/app-types";

interface CreditsClientProps {
  wallet: CreditWallet | null;
  connectionState: BackendConnectionState;
}

const BILLING_RULES = [
  {
    title: "25 credits per 15 seconds",
    detail: "Formula: ceil(duration_seconds / 15) × 25. One full minute equals 100 credits.",
  },
  {
    title: "Up to 10 minutes per video",
    detail: "Individual renders can run anywhere from 15 seconds (25 credits) to 10 minutes (1,000 credits).",
  },
  {
    title: "Upfront credit reservation",
    detail: "Estimated credits are reserved when generation launches and reconciled on completion.",
  },
  {
    title: "Automatic refunds on failure",
    detail: "If a technical error prevents rendering or R2 upload, reserved credits return automatically.",
  },
];

export function CreditsClient({ wallet, connectionState }: CreditsClientProps) {
  const [checkoutNotice, setCheckoutNotice] = useState<{
    packName: string;
    priceDisplay: string;
    creditsLabel: string;
  } | null>(null);

  return (
    <div className="space-y-6 pb-8">
      {/* Header + Wallet Summary */}
      <header className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[24px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6 lg:col-span-7">
          <Eyebrow showSparkle>One-Time Credits</Eyebrow>
          <h1 className="mt-2.5 font-display text-[clamp(1.6rem,3vw,2.25rem)] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
            Simple credit packs. Zero subscriptions.
          </h1>
          <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-beevo-body">
            Buy credits only when you have stories to tell. No monthly renewals, no surprise tiers,
            and transparent 15-second billing across every cartoon style.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/app/transactions"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-beevo-border bg-beevo-canvas px-4 text-[13px] font-bold text-beevo-ink hover:bg-beevo-cream"
            >
              <ReceiptText className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
              View Transaction Ledger
            </Link>
            <Link
              href="/refund-policy"
              className="inline-flex min-h-[44px] items-center text-[13px] font-bold text-beevo-muted hover:text-beevo-ink"
            >
              Refund Policy
            </Link>
          </div>
        </div>

        {/* Live Wallet Card */}
        <div className="rounded-[24px] border border-beevo-border-warm bg-gradient-to-br from-[#FFFDF7] to-[#FFF6D6] p-5 shadow-beevo-card sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-beevo-honey-text">
              <Coins className="h-4 w-4" aria-hidden="true" />
              Current Wallet Balance
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-beevo-muted">
              {connectionState === "connected" ? "Live" : "Phase 4 sync"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <p className="font-display text-[36px] font-extrabold leading-none tabular-nums text-beevo-ink">
              {wallet ? wallet.availableCredits.toLocaleString() : "—"}
            </p>
            <span className="text-[14px] font-semibold text-beevo-muted">available credits</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-beevo-border-warm/80 pt-3.5 text-[12.5px]">
            <div>
              <p className="text-beevo-muted">Reserved Credits</p>
              <p className="mt-0.5 font-display text-[15px] font-extrabold tabular-nums text-beevo-ink">
                {wallet ? wallet.reservedCredits.toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-beevo-muted">Lifetime Purchased</p>
              <p className="mt-0.5 font-display text-[15px] font-extrabold tabular-nums text-beevo-ink">
                {wallet ? wallet.lifetimePurchasedCredits.toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Honest Checkout Notice (Never fakes a purchase or adds fake credits) */}
      {checkoutNotice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start justify-between gap-3 rounded-[18px] border border-beevo-border-warm bg-beevo-cream/90 p-4 text-[13.5px] leading-relaxed text-beevo-body shadow-sm"
        >
          <div className="flex items-start gap-2.5">
            <Info
              className="mt-0.5 h-5 w-5 shrink-0 text-beevo-honey-text"
              aria-hidden="true"
            />
            <div>
              <p className="font-display text-[14.5px] font-extrabold text-beevo-ink">
                Checkout connects in Phase 4 — no charge was made
              </p>
              <p className="mt-0.5">
                You selected the <strong>{checkoutNotice.packName}</strong> pack (
                <strong>{checkoutNotice.priceDisplay}</strong> for{" "}
                <strong>{checkoutNotice.creditsLabel}</strong>). Live payment checkout and
                server-verified credit ledger fulfillment activate when backend billing connects in
                Phase 4.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutNotice(null)}
            aria-label="Close checkout notice"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-beevo-muted hover:text-beevo-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Confirmed INR Credit Packs Grid */}
      <section aria-labelledby="credit-packs-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="credit-packs-heading"
              className="font-display text-[20px] font-extrabold tracking-[-0.02em] text-beevo-ink"
            >
              Choose a Credit Pack
            </h2>
            <p className="text-[13.5px] text-beevo-muted">
              All packs unlock all 8 visual styles, dynamic storyboards, captions, and MP4 exports.
            </p>
          </div>
          <span className="text-[12.5px] font-bold text-beevo-muted">Prices in INR (₹)</span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PRICING_PACKS.map((pack) => {
            const highlighted = Boolean(pack.popular);
            return (
              <article
                key={pack.id}
                className={`relative flex flex-col justify-between rounded-[24px] p-6 transition-all ${
                  highlighted
                    ? "border-2 border-[#FFC928] bg-beevo-dark text-[#FFFDF7] shadow-beevo"
                    : "border border-beevo-border bg-white text-beevo-ink shadow-beevo-card"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`font-display text-[20px] font-extrabold tracking-[-0.02em] ${
                        highlighted ? "text-[#FFFDF7]" : "text-beevo-ink"
                      }`}
                    >
                      {pack.name}
                    </h3>
                    {highlighted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFC928] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-beevo-ink">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Most Popular
                      </span>
                    )}
                  </div>

                  <p
                    className={`mt-1.5 text-[13.5px] ${
                      highlighted ? "text-[#D4CEC3]" : "text-beevo-muted"
                    }`}
                  >
                    {pack.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span
                      className={`font-display text-[36px] font-extrabold leading-none tabular-nums ${
                        highlighted ? "text-[#FFFDF7]" : "text-beevo-ink"
                      }`}
                    >
                      {pack.priceDisplay}
                    </span>
                    <span
                      className={`text-[13px] font-semibold ${
                        highlighted ? "text-[#C5BFB3]" : "text-beevo-muted"
                      }`}
                    >
                      one-time
                    </span>
                  </div>

                  <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-extrabold ${
                      highlighted
                        ? "bg-[#2C2822] text-[#FFC928]"
                        : "bg-beevo-cream text-beevo-honey-text"
                    }`}
                  >
                    <span>{pack.creditsLabel}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{pack.capacityLabel}</span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-[13.5px]">
                    {pack.facts.map((fact) => (
                      <li key={fact} className="flex items-start gap-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            highlighted ? "text-[#FFC928]" : "text-beevo-honey-text"
                          }`}
                          aria-hidden="true"
                        />
                        <span className={highlighted ? "text-[#ECE7DD]" : "text-beevo-body"}>
                          {fact}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCheckoutNotice({
                      packName: pack.name,
                      priceDisplay: pack.priceDisplay,
                      creditsLabel: pack.creditsLabel,
                    })
                  }
                  className={`mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-extrabold transition-all ${
                    highlighted
                      ? "bg-[#FFC928] text-beevo-ink shadow-beevo-yellow-sm hover:bg-[#F5BC15]"
                      : "bg-beevo-dark text-[#FFFDF7] hover:bg-[#2F2B25]"
                  }`}
                >
                  Select {pack.name} ({pack.priceDisplay})
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Transparent Billing Rules */}
      <section
        aria-labelledby="billing-rules-heading"
        className="rounded-[24px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-beevo-honey-text" aria-hidden="true" />
          <h2
            id="billing-rules-heading"
            className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-beevo-ink"
          >
            How Beevo Credit Billing Works
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BILLING_RULES.map((rule) => (
            <div
              key={rule.title}
              className="rounded-[16px] border border-beevo-border bg-beevo-canvas p-4"
            >
              <h3 className="font-display text-[14px] font-extrabold text-beevo-ink">
                {rule.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-beevo-muted">
                {rule.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
