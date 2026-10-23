import type { Metadata } from "next";
import { Ban } from "lucide-react";
import { FEATURE_GROUPS } from "@/lib/content";
import { CTASection, PageHero } from "@/components/marketing/blocks";
import { Button } from "@/components/ui/button";
import { ContentIcon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/motion";
import { Sticker } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Creator profile, course storefront, video lessons, file uploads, secure payments, and a learner dashboard — everything in CourseKit's single free plan.",
};

const ABSENT_BY_DESIGN = [
  {
    title: "No marketplace feed",
    body: "No shared catalogue, no rankings, no \"similar courses\" pointing buyers away from you.",
  },
  {
    title: "No paid tiers",
    body: "There's no Pro plan with the good features locked inside. This list is the free plan.",
  },
  {
    title: "No ads or sponsors",
    body: "Your storefront shows your courses — never someone else's promotion.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title={
          <>
            Every feature.{" "}
            <span className="font-editorial font-normal text-accent italic">
              One free plan.
            </span>
          </>
        }
        lede="This is the complete product, not a teaser for a paid tier. ₹0/month — we earn 8% only when you make a successful eligible sale."
      >
        <Button href="/signup" variant="accent" size="lg">
          Start free
        </Button>
        <Button href="/pricing" variant="outline" size="lg">
          See pricing
        </Button>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURE_GROUPS.map((group, index) => (
            <Reveal key={group.title} delay={index * 0.06}>
              <div className="h-full rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-sm sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-hard-xs">
                    <ContentIcon name={group.icon} className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                      {group.title}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-pretty text-smoke">
                  {group.lede}
                </p>
                <div className="ticket-divider my-5" aria-hidden="true" />
                <ul className="space-y-4">
                  {group.points.map((point) => (
                    <li key={point.title}>
                      <p className="text-sm font-bold text-ink">{point.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-smoke">
                        {point.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y-2 border-ink bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <Reveal>
            <Sticker color="accent" className="border-cream shadow-none">
              Absent by design
            </Sticker>
            <h2 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              What we deliberately{" "}
              <span className="font-editorial font-normal text-lime italic">
                didn’t
              </span>{" "}
              build
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {ABSENT_BY_DESIGN.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.07}>
                <div className="h-full rounded-3xl border-2 border-cream/25 bg-cream/5 p-6">
                  <Ban className="size-6 text-accent" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/60">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
