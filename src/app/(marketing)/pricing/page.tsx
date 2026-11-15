import React from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { PricingSection } from "@/components/home/PricingSection";
import { CreditCalculator } from "@/components/pricing/CreditCalculator";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { JsonLd, buildFaqSchema, buildPricingProductSchema } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";
import { FAQ_ITEMS } from "@/lib/beevo-data";

export const metadata = createPageMetadata({
  title: "Pricing — Simple One-Time Credit Packs",
  description:
    "Buy Beevo credits once with zero monthly subscriptions. Starter ₹299 (300 credits / 3 min), Creator ₹599 (800 credits / 8 min), and Studio ₹899 (1,500 credits / 15 min).",
  path: "/pricing",
});

const BILLING_FAQS = FAQ_ITEMS.filter(
  (f) => f.category === "Credits & Billing" || f.category === "Reliability"
);

export default function PricingPage() {
  return (
    <>
      <JsonLd data={buildPricingProductSchema()} />
      <JsonLd data={buildFaqSchema(BILLING_FAQS)} />

      {/* Page Intro */}
      <section className="bg-beevo-canvas pt-10 md:pt-14">
        <div className="beevo-container">
          <Breadcrumbs items={[{ name: "Pricing", href: "/pricing" }]} />
          <div className="max-w-2xl">
            <Eyebrow>Transparent INR Pricing</Eyebrow>
            <h1 className="mt-3.5 font-display text-[clamp(2rem,3.6vw,2.9rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
              Simple one-time credit packs.{" "}
              <span className="text-beevo-honey-display">No monthly lock-in.</span>
            </h1>
            <p className="mt-4 text-[15.5px] leading-[1.68] text-beevo-body">
              Pay once for the exact storytelling minutes you want. Every pack includes all eight
              cartoon visual styles, ElevenLabs narration with timestamp sync, smooth motion
              graphics, captions, licensed audio, and downloadable MP4 output.
            </p>
          </div>
        </div>
      </section>

      {/* Main Three-Pack Reference Layout */}
      <PricingSection headingAs="h2" />

      {/* Interactive Credit-to-Duration Calculator */}
      <section className="bg-beevo-cream/65 py-12 md:py-16">
        <div className="beevo-container">
          <CreditCalculator />
        </div>
      </section>

      {/* What's Included + Failed Render Guarantee */}
      <section className="bg-beevo-canvas py-14 md:py-16">
        <div className="beevo-container">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-[20px] border border-beevo-border bg-white p-6 shadow-beevo-card lg:col-span-7 sm:p-8">
              <h2 className="font-display text-[20px] font-extrabold text-beevo-ink">
                Included in Starter, Creator &amp; Studio
              </h2>
              <p className="mt-2 text-[14px] text-beevo-muted">
                We do not gate styles, aspect ratios, or voice quality behind higher tiers.
              </p>
              <ul className="mt-5 grid grid-cols-1 gap-3 text-[14px] font-medium text-beevo-body sm:grid-cols-2">
                {[
                  "OpenAI script & dynamic storyboard",
                  "Consistent character references via fal.ai",
                  "All 8 supported cartoon visual styles",
                  "ElevenLabs narration & timestamp sync",
                  "16:9, 9:16, and 1:1 aspect ratios",
                  "FFmpeg motion, transitions & captions",
                  "Licensed background music & SFX",
                  "Private Cloudflare R2 MP4 download",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink"
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[20px] border border-beevo-border-warm bg-beevo-cream/75 p-6 shadow-beevo-card lg:col-span-5 sm:p-8">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-beevo-yellow text-beevo-ink">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-[20px] font-extrabold text-beevo-ink">
                Failed-Generation Credit Protection
              </h2>
              <p className="mt-2.5 text-[14.5px] leading-[1.66] text-beevo-body">
                If a technical error prevents your video from completing, the credits reserved for
                that failed job are automatically restored to your account balance—never silently
                consumed.
              </p>
              <Link
                href="/refund-policy"
                className="mt-5 inline-flex min-h-[44px] items-center text-[13.5px] font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4 hover:text-beevo-honey-text"
              >
                Read full Refund &amp; Credit Policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Billing & Credits FAQ */}
      <section className="bg-beevo-cream/50 py-14 md:py-16">
        <div className="beevo-container max-w-4xl">
          <div className="mb-6">
            <Eyebrow>Billing Questions</Eyebrow>
            <h2 className="mt-3 font-display text-[26px] font-extrabold tracking-[-0.025em] text-beevo-ink">
              Credits, limits &amp; refund clarity
            </h2>
          </div>
          <FaqAccordion items={BILLING_FAQS} defaultOpenId="how-credits-work" />
        </div>
      </section>

      <FinalCtaBand />
    </>
  );
}
