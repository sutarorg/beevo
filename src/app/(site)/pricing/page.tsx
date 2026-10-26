import type { Metadata } from "next";
import { PRICING_FAQS } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";
import { CTASection, PageHero, PlanCard } from "@/components/marketing/blocks";
import { RelatedLinks } from "@/components/marketing/related-links";
import { CommissionCalculator } from "@/components/marketing/commission-calculator";
import { Accordion, Reveal } from "@/components/ui/motion";

export const metadata: Metadata = createPageMetadata({
  title: "Pricing — free plan, 8% only when you sell",
  description:
    "Beevo has one free plan at ₹0/month. We charge a flat 8% commission per successful eligible course sale — no Pro plan, no subscriptions, no setup fee.",
  path: "/pricing",
  keywords: ["online course platform pricing", "course platform commission", "free course selling"],
});

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            One plan.{" "}
            <span className="font-editorial font-normal text-accent italic">
              No tiers.
            </span>{" "}
            No trap.
          </>
        }
        lede="Every creator gets the complete product at ₹0/month. The only thing we ever charge is an 8% commission — and only when a course sale actually succeeds."
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <PlanCard />
        </Reveal>
      </section>

      <section className="border-y-2 border-ink bg-parchment">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                The 8%, explained like{" "}
                <span className="font-editorial font-normal text-accent italic">
                  adults
                </span>
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-smoke sm:text-base">
                <p>
                  When a learner successfully buys your course, 8% of the sale
                  amount is retained as the platform commission and 92% accrues
                  to you as the creator share. If you never sell, you never pay —
                  the plan stays free either way.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Commission applies per successful, eligible course sale.",
                    "Failed, reversed, or refunded transactions are not charged.",
                    "Payment-gateway charges and applicable taxes settle separately, per the payment provider's terms.",
                    "Payouts are recorded manually by platform administration, subject to provider approval and settlement timelines.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span className="text-smoke">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="rounded-2xl border-2 border-ink bg-white p-4 text-xs text-smoke">
                  Any numbers on this page are worked examples to explain the
                  maths — never projections, and never a guarantee of what you
                  will earn or receive.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <CommissionCalculator />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Pricing{" "}
            <span className="font-editorial font-normal text-accent italic">
              questions
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-10 rounded-3xl border-2 border-ink bg-white px-5 shadow-hard-sm sm:px-8">
            <Accordion items={PRICING_FAQS} />
          </div>
        </Reveal>
      </section>

      <RelatedLinks
        links={[
          {
            href: "/how-it-works",
            label: "How it works",
            description: "See where the 8% lands in a real sale and how payouts are recorded.",
          },
          {
            href: "/faq",
            label: "FAQ",
            description: "Commission, payments, refunds, and platform questions answered.",
          },
          {
            href: "/refund-policy",
            label: "Refund policy",
            description: "Our purchase policy, including mandatory statutory remedies.",
          },
        ]}
      />

      <CTASection />
    </>
  );
}
