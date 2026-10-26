import type { Metadata } from "next";
import { Landmark, ReceiptText } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "@/lib/content";
import {
  commissionBreakdown,
  formatINR,
  CREATOR_SHARE_LABEL,
  PLATFORM_COMMISSION_LABEL,
} from "@/lib/domain";
import { createPageMetadata } from "@/lib/seo";
import { CTASection, PageHero } from "@/components/marketing/blocks";
import { RelatedLinks } from "@/components/marketing/related-links";
import { Button } from "@/components/ui/button";
import { ContentIcon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/motion";

export const metadata: Metadata = createPageMetadata({
  title: "How Beevo works — sell your first course",
  description:
    "From free signup to first course sale: claim your profile, publish a course, share your link, and get paid — with a flat 8% commission on successful sales.",
  path: "/how-it-works",
  keywords: ["how to sell a course online", "create an online course India", "course checkout"],
});

const example = commissionBreakdown(99900);

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            Idea to income, in{" "}
            <span className="font-editorial font-normal text-accent italic">
              four
            </span>{" "}
            moves
          </>
        }
        lede="No storefront plugins, no payment-gateway puzzling, no waiting for an approval queue. This is the entire loop."
      >
        <Button href="/signup" variant="accent" size="lg">
          Start free
        </Button>
      </PageHero>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-7 hidden w-0.5 -translate-x-1/2 border-l-2 border-dashed border-ink/30 sm:block"
          />
          <ol className="relative space-y-10">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <li key={step.step} className="relative sm:pl-24">
              <Reveal delay={index * 0.05}>
                <div className="hidden size-14 items-center justify-center rounded-full border-2 border-ink bg-accent text-cream shadow-hard-sm sm:absolute sm:top-1 sm:left-0 sm:flex">
                  <ContentIcon name={step.icon} className="size-6" />
                </div>
                <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-sm sm:p-8">
                  <div className="flex items-center gap-3 sm:hidden">
                    <div className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-accent text-cream">
                      <ContentIcon name={step.icon} className="size-5" />
                    </div>
                    <p className="font-editorial text-xl text-accent-deep italic">
                      {step.step}
                    </p>
                  </div>
                  <p className="hidden font-editorial text-xl text-accent-deep italic sm:block">
                    {step.step}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-smoke sm:text-base">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
          </ol>
        </div>
      </section>

      <section className="border-y-2 border-ink bg-parchment">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <Reveal>
              <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl border-2 border-ink bg-lime">
                    <ReceiptText className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-ink">
                    What a sale looks like
                  </h2>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-smoke">
                  Say you price a course at {formatINR(example.grossInPaise)} and a
                  follower buys it through your link:
                </p>
                <dl className="mt-5 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-ink/20 pb-3">
                    <dt className="text-sm font-semibold text-smoke">
                      Buyer pays
                    </dt>
                    <dd className="text-lg font-bold text-ink tabular-nums">
                      {formatINR(example.grossInPaise)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-b-2 border-dashed border-ink/20 pb-3">
                    <dt className="text-sm font-semibold text-smoke">
                      Beevo commission ({PLATFORM_COMMISSION_LABEL})
                    </dt>
                    <dd className="text-lg font-bold text-accent-deep tabular-nums">
                      −{formatINR(example.platformFeeInPaise, { decimals: true })}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-semibold text-smoke">
                      Your share ({CREATOR_SHARE_LABEL})
                    </dt>
                    <dd className="font-editorial text-3xl text-ink italic tabular-nums">
                      {formatINR(example.creatorShareInPaise, { decimals: true })}
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 rounded-xl bg-parchment p-3 text-xs leading-relaxed text-smoke">
                  Illustrative example only. Payment-gateway charges and
                  applicable taxes are settled separately per the payment
                  provider&apos;s terms. This is not a promise, projection, or
                  guarantee of earnings or payouts.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="rounded-3xl border-2 border-ink bg-ink p-6 text-cream shadow-hard sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl border-2 border-cream bg-accent">
                    <Landmark className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    How payouts work
                  </h2>
                </div>
                <ul className="mt-5 space-y-4">
                  {[
                    {
                      title: "Sales settle with our payment partner",
                      body: "Buyer payments are processed by Razorpay through their standard settlement flow.",
                    },
                    {
                      title: "The 8% is split at the source",
                      body: "The platform commission is retained per sale; the creator share accrues to your balance.",
                    },
                    {
                      title: "Payouts are recorded manually",
                      body: "Platform administrators record creator payouts manually under the intended payment arrangement, subject to provider approval and settlement timelines.",
                    },
                    {
                      title: "You can always see the maths",
                      body: "Every sale, fee, and payout record is visible against your account — nothing is estimated or hidden.",
                    },
                  ].map((item) => (
                    <li key={item.title}>
                      <p className="text-sm font-bold text-lime">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-cream/70">
                        {item.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <RelatedLinks
        links={[
          {
            href: "/pricing",
            label: "Pricing",
            description: "The full 8% maths, worked examples, and the single free plan.",
          },
          {
            href: "/features",
            label: "Features",
            description: "Course studio, storefront, checkout, and the learner dashboard.",
          },
          {
            href: "/faq",
            label: "FAQ",
            description: "Plans, payouts, refunds, and what happens after a sale.",
          },
        ]}
      />

      <CTASection
        title="Weekend project. Weekday income."
        body="The tools are free. The audience is already yours. The only missing piece is about four steps."
      />
    </>
  );
}
