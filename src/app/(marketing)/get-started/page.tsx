import React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PRICING_PACKS } from "@/lib/beevo-data";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Get Started with Beevo",
  description: "Select your Beevo one-time credit pack to begin creating animated cartoon videos.",
  path: "/get-started",
  noIndex: true,
});

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string }>;
}) {
  const params = await searchParams;
  const selectedPack =
    PRICING_PACKS.find((p) => p.id === params.pack) ??
    PRICING_PACKS.find((p) => p.popular) ??
    PRICING_PACKS[1];

  return (
    <section className="bg-beevo-canvas py-12 md:py-18">
      <div className="beevo-container">
        <div className="mx-auto max-w-2xl rounded-[24px] border border-beevo-border bg-white p-7 shadow-beevo sm:p-10">
          <Eyebrow showSparkle>Start Creating with Beevo</Eyebrow>
          <h1 className="mt-3.5 font-display text-[clamp(1.75rem,3vw,2.35rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-beevo-ink">
            Ready to build your first cartoon video
          </h1>
          <p className="mt-3 text-[14.5px] leading-[1.66] text-beevo-body">
            Review your selected one-time credit pack below. Create your account or explore the
            Beevo Studio creation workspace before checkout connects in Phase 4.
          </p>

          {/* Pack Switcher */}
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {PRICING_PACKS.map((pack) => {
              const active = pack.id === selectedPack.id;
              return (
                <Link
                  key={pack.id}
                  href={`/get-started?pack=${pack.id}`}
                  className={`flex flex-col items-center rounded-[14px] border px-3 py-3 text-center transition-colors ${
                    active
                      ? "border-2 border-beevo-yellow bg-beevo-cream/80 text-beevo-ink shadow-sm"
                      : "border-beevo-border bg-beevo-canvas text-beevo-muted hover:border-beevo-border-warm"
                  }`}
                >
                  <span className="font-display text-[13.5px] font-extrabold text-beevo-ink">
                    {pack.name}
                  </span>
                  <span className="mt-0.5 text-[15px] font-extrabold tabular-nums text-beevo-ink">
                    {pack.priceDisplay}
                  </span>
                  <span className="text-[11.5px] font-semibold text-beevo-honey-text">
                    {pack.creditsLabel}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Selected Pack Summary */}
          <div className="mt-6 rounded-[18px] border border-beevo-border-warm bg-beevo-cream/65 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-display text-[16px] font-extrabold text-beevo-ink">
                <Sparkles className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                {selectedPack.name} Credit Pack
              </span>
              <span className="font-display text-[22px] font-extrabold tabular-nums text-beevo-ink">
                {selectedPack.priceDisplay}{" "}
                <span className="text-[12px] font-semibold text-beevo-muted">one-time</span>
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] font-semibold text-beevo-body">
              {selectedPack.creditsLabel} &middot; {selectedPack.capacityLabel}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-[13px] font-medium text-beevo-body sm:grid-cols-2">
              {selectedPack.facts.map((fact) => (
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="beevo-btn-primary min-h-[46px] flex-1 text-[14px]">
              Create Account
            </Link>
            <Link href="/app/create" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
              Open Studio Workspace
            </Link>
            <Link href="/pricing" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
