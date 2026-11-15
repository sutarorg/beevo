import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PRICING_CHECKLIST, PRICING_PACKS } from "@/lib/beevo-data";

interface PricingSectionProps {
  headingAs?: "h1" | "h2";
  showHeading?: boolean;
}

export function PricingSection({
  headingAs = "h2",
  showHeading = true,
}: PricingSectionProps) {
  const HeadingTag = headingAs;

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="bg-beevo-canvas py-14 md:py-[72px]">
      <div className="beevo-container">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-7">
          {/* Left Pricing Introduction & Checklist (~27% on desktop) */}
          <div className="lg:col-span-3 lg:pt-3">
            <Eyebrow>Simple pricing. One-time payment.</Eyebrow>
            {showHeading && (
              <HeadingTag
                id="pricing-heading"
                className="mt-3.5 font-display text-[clamp(1.75rem,2.6vw,2.15rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                Choose your credit pack
              </HeadingTag>
            )}

            <ul className="mt-5 space-y-3">
              {PRICING_CHECKLIST.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-[13.5px] font-semibold leading-snug text-beevo-body"
                >
                  <span
                    className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Three Aligned Credit Pack Cards (~73% on desktop) */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 md:gap-4 lg:gap-5">
              {PRICING_PACKS.map((pack) => {
                const isPopular = Boolean(pack.popular);
                return (
                  <article
                    key={pack.id}
                    className={`relative flex flex-col justify-between rounded-[20px] bg-white px-5 pb-6 pt-7 transition-transform duration-200 hover:-translate-y-0.5 sm:px-6 ${
                      isPopular
                        ? "border-2 border-beevo-yellow shadow-beevo-popular"
                        : "border border-beevo-border shadow-beevo-card"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-b from-[#FFD44A] to-[#F7BD12] px-3.5 py-1 text-[11.5px] font-extrabold tracking-[0.01em] text-beevo-ink shadow-sm">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <div className="text-center">
                        <h3 className="font-display text-[17px] font-extrabold text-beevo-ink">
                          {pack.name}
                        </h3>

                        <div className="mt-3.5 flex items-baseline justify-center gap-1">
                          <span className="font-display text-[36px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-beevo-ink">
                            {pack.priceDisplay}
                          </span>
                          <span className="text-[12.5px] font-semibold text-beevo-muted">
                            one-time
                          </span>
                        </div>

                        <p className="mt-2.5 inline-flex items-center rounded-full bg-beevo-cream px-3 py-1 text-[12.5px] font-extrabold text-beevo-honey-text">
                          {pack.creditsLabel}
                        </p>

                        <p className="mt-2 text-[13px] font-bold text-beevo-ink">
                          {pack.capacityLabel}
                        </p>
                        <p className="mt-0.5 text-[12px] font-medium text-beevo-muted">
                          {pack.ratePerMinute}
                        </p>
                      </div>

                      <div className="my-5 border-t border-beevo-border/80" />

                      <ul className="space-y-2.5 text-[13px] font-medium leading-snug text-beevo-body">
                        {pack.facts.map((fact) => (
                          <li key={fact} className="flex items-start gap-2">
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text"
                              aria-hidden="true"
                            />
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-2">
                      <Link
                        href={`/get-started?pack=${pack.id}`}
                        className={`min-h-[44px] w-full text-[13.5px] ${
                          isPopular ? "beevo-btn-primary" : "beevo-btn-secondary"
                        }`}
                      >
                        Get Started
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Required Transparent Credit Clarifications Directly Below Cards */}
            <div className="mt-5 rounded-[14px] border border-beevo-border bg-beevo-cream/55 px-4 py-3.5 text-center text-[12.5px] font-medium leading-relaxed text-beevo-body sm:px-5 sm:text-left">
              <strong className="font-bold text-beevo-ink">How credits work:</strong>{" "}
              <span className="font-bold text-beevo-ink">100 credits = 1 minute</span> &middot;{" "}
              <span className="font-bold text-beevo-ink">25 credits = 15 seconds</span> &middot;
              Credits can be split across multiple projects &middot; Individual projects can be up
              to <span className="font-bold text-beevo-ink">10 minutes</span> &middot; All packs are
              one-time purchases, never subscriptions.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
