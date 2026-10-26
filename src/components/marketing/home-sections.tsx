import { ArrowRight, Check, Sparkle } from "lucide-react";
import Image from "next/image";
import { BENEFITS, HOW_IT_WORKS_STEPS, MARQUEE_ITEMS, FAQS } from "@/lib/content";
import { MOCK_CREATORS, MOCK_DATA_NOTICE } from "@/lib/mocks/creators";
import { PLATFORM_COMMISSION_LABEL } from "@/lib/domain";
import { cn } from "@/lib/utils";
import {
  CourseCard,
  CreatorShowcaseCard,
  StorefrontPhoneMock,
} from "@/components/marketing/cards";
import { PlanCard } from "@/components/marketing/blocks";
import { Button } from "@/components/ui/button";
import { ContentIcon } from "@/components/ui/icon";
import { Accordion, Marquee, Reveal } from "@/components/ui/motion";
import { SectionHeader, Sticker } from "@/components/ui/primitives";

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b-2 border-ink">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:pt-24 lg:pb-24">
        <div className="min-w-0">
          <Reveal>
            <Sticker color="lime">Free plan · ₹0/month · No marketplace</Sticker>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-7 text-[clamp(2.25rem,13vw,2.9rem)] leading-[0.98] font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Your audience{" "}
              <span className="font-editorial font-normal text-accent italic">
                is the
              </span>{" "}
              <span className="relative inline-block">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[-0.15em] inset-y-[0.08em] -rotate-1 rounded-lg bg-lime"
                />
                <span className="relative">marketplace.</span>
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-smoke sm:text-lg">
              Beevo gives creators a personal storefront to sell courses
              directly — through the links you already share. No public
              catalogue, no algorithm deciding who sees you. Just your page,
              your price, and secure checkout.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/signup" variant="accent" size="lg">
                Start free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button href="/how-it-works" variant="outline" size="lg">
                See how it works
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink">
              {[
                "8% only when you sell",
                "UPI, cards & net-banking",
                "Your links, your buyers",
              ].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full border-2 border-ink bg-lime">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="relative mx-auto min-w-0 lg:mx-0">
          <div className="relative flex justify-center">
            <Sparkle
              aria-hidden="true"
              className="animate-float absolute -top-4 left-2 size-8 text-accent lg:left-6"
            />
            <Sparkle
              aria-hidden="true"
              className="animate-float absolute right-2 bottom-16 size-6 text-accent [animation-delay:1.2s] lg:right-10"
            />
            <StorefrontPhoneMock className="rotate-2" />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:-right-4 lg:translate-x-0">
              <Sticker color="accent" className="rotate-3">
                You keep 92%
              </Sticker>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function TickerSection() {
  return <Marquee items={MARQUEE_ITEMS} tone="lime" />;
}

// ---------------------------------------------------------------------------
// Benefits
// ---------------------------------------------------------------------------

export function BenefitsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <SectionHeader
          eyebrow="Why creators switch"
          title={
            <>
              Everything after the{" "}
              <span className="font-editorial font-normal text-accent italic">follow</span>{" "}
              button
            </>
          }
          lede="You did the hard part — building an audience that trusts you. Beevo turns that trust into a course business without renting it back to you."
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
        {BENEFITS.map((benefit, index) => (
          <Reveal key={benefit.title} delay={index * 0.07} className="min-w-0">
            <div className="group h-full rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-sm transition-transform duration-200 hover:-translate-y-1 sm:p-7">
              <div className="grid size-12 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-hard-xs transition-transform duration-200 group-hover:-rotate-6">
                <ContentIcon name={benefit.icon} className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                {benefit.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Not a marketplace
// ---------------------------------------------------------------------------

const NO_MARKETPLACE_POINTS = [
  {
    value: "0",
    label: "marketplace listings",
    body: "There is no shared catalogue to get lost in — or buried under.",
  },
  {
    value: "100%",
    label: "of traffic is yours",
    body: "Every buyer arrives through a link you chose to share.",
  },
  {
    value: PLATFORM_COMMISSION_LABEL,
    label: "flat commission",
    body: "One honest cut on successful eligible sales. Nothing else.",
  },
];

export function NotMarketplaceSection() {
  return (
    <section className="border-y-2 border-ink bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <SectionHeader
            dark
            eyebrow="The honest fine print"
            title={
              <>
                We will never{" "}
                <span className="font-editorial font-normal text-lime italic">outrank</span>{" "}
                you.
              </>
            }
            lede="Marketplaces are wonderful — until the algorithm decides your course competes with 40,000 others for a slot on page nine. Beevo skips the catalogue entirely. Discovery happens on your channels, where it always did."
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {NO_MARKETPLACE_POINTS.map((point, index) => (
            <Reveal key={point.label} delay={index * 0.08} className="min-w-0">
              <div className="h-full rounded-3xl border-2 border-cream/25 bg-cream/5 p-6">
                <p className="font-editorial text-6xl text-lime italic tabular-nums">
                  {point.value}
                </p>
                <p className="mt-2 text-sm font-bold tracking-[0.14em] text-cream uppercase">
                  {point.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-cream/60">
                  {point.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <SectionHeader
          align="center"
          eyebrow="Zero to first sale"
          title={
            <>
              Four steps.{" "}
              <span className="font-editorial font-normal text-accent italic">
                One weekend.
              </span>
            </>
          }
          lede="No store builder, no plugins, no gatekeeping review queue. If you can post a video, you can sell a course."
        />
      </Reveal>
      <ol className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <li key={step.step} className="relative min-w-0">
            {/*
              Connector runs from the right edge of this step's icon to the
              left edge of the next one: icon is size-14 (3.5rem), so the line
              starts at left-14 and bleeds exactly one grid gap (-right-6) into
              the next column. Hidden on stacked/2-column layouts.
            */}
            {index < HOW_IT_WORKS_STEPS.length - 1 ? (
              <div
                aria-hidden="true"
                className="ticket-divider absolute top-7 left-14 -right-6 hidden -translate-y-1/2 lg:block"
              />
            ) : null}
            <Reveal delay={index * 0.08}>
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border-2 border-ink bg-accent text-cream shadow-hard-sm lg:mx-0">
                <ContentIcon name={step.icon} className="size-6" />
              </div>
              <p className="mt-4 text-center font-editorial text-lg text-accent-deep italic lg:text-left">
                {step.step}
              </p>
              <h3 className="mt-1 text-center text-lg font-bold text-ink lg:text-left">
                {step.title}
              </h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-smoke lg:text-left">
                {step.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
      <Reveal delay={0.2}>
        <div className="mt-12 text-center">
          <Button
            href="/how-it-works"
            variant="outline"
            className="h-auto min-h-11 py-2 text-center whitespace-normal"
          >
            The detailed walkthrough
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Storefront showcase
// ---------------------------------------------------------------------------

export function ShowcaseSection() {
  return (
    <section className="overflow-hidden border-y-2 border-ink bg-parchment">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <SectionHeader
            eyebrow="Storefront examples"
            title={
              <>
                Pages that look like{" "}
                <span className="font-editorial font-normal text-accent italic">you,</span>{" "}
                not like us
              </>
            }
            lede="A profile with your face, your courses with your prices, your links where your audience already clicks. This is the shape of every Beevo storefront."
          />
        </Reveal>
        <p className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-smoke sm:mt-8">
          <Sticker color="cream">Demo</Sticker>
          {MOCK_DATA_NOTICE}
        </p>
        {/*
          grid-cols-1 (minmax(0, 1fr)) is load-bearing: a bare `grid` with
          columns only at larger breakpoints creates an implicit `auto`
          track sized to the cards' max-content (~415px), which pushed the
          cards off the right edge of phone screens. Cards also need real
          width for their course rows, so 3-up starts at lg; on md the
          third card spans the row, centred at the same width as the pair.
        */}
        <div className="mx-auto mt-12 grid w-full max-w-md grid-cols-1 gap-6 md:max-w-none md:grid-cols-2 lg:grid-cols-3">
          {MOCK_CREATORS.map((creator, index) => (
            <Reveal
              key={creator.id}
              delay={index * 0.08}
              className={cn(
                "min-w-0",
                index === 2 &&
                  "md:col-span-2 md:mx-auto md:w-[calc(50%-0.75rem)] lg:col-span-1 lg:mx-0 lg:w-auto",
              )}
            >
              <CreatorShowcaseCard
                creator={creator}
                rotate={index === 1 ? 1 : -1}
                className="h-full"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Create & learn — course features preview
// ---------------------------------------------------------------------------

const CREATE_FEATURES = [
  "Video lessons streamed securely to buyers",
  "File uploads — PDFs, presets, worksheets",
  "Sections, lessons, drafts, publish when ready",
  "Your course sales page, priced in rupees",
];

const LEARN_FEATURES = [
  "Checkout with UPI, cards, and net-banking",
  "Instant email receipt and access link",
  "Personal learner dashboard with every purchase",
  "Watch on phone or desktop, anytime",
];

export function CreateLearnSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <SectionHeader
          eyebrow="Course creation & learning"
          title={
            <>
              Built for{" "}
              <span className="font-editorial font-normal text-accent italic">both sides</span>{" "}
              of the buy button
            </>
          }
          lede="Creators get a real studio. Buyers get a real classroom. Neither needs a manual."
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          {
            eyebrow: "You create",
            title: "A studio that stays out of the way",
            items: CREATE_FEATURES,
            courseId: MOCK_CREATORS[2].courses[0].id,
          },
          {
            eyebrow: "They learn",
            title: "A classroom their money deserves",
            items: LEARN_FEATURES,
            courseId: MOCK_CREATORS[2].courses[0].id,
          },
        ].map((panel, panelIndex) => (
          <Reveal key={panel.eyebrow} delay={panelIndex * 0.08} className="min-w-0">
            <div
              className={cn(
                "flex h-full flex-col rounded-3xl border-2 border-ink p-6 shadow-hard-sm sm:p-8",
                panelIndex === 0 ? "bg-white" : "bg-moss text-cream",
              )}
            >
              <p
                className={cn(
                  "text-xs font-bold tracking-[0.22em] uppercase",
                  panelIndex === 0 ? "text-accent-deep" : "text-lime",
                )}
              >
                {panel.eyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">
                {panel.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {panel.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
                        panelIndex === 0
                          ? "border-ink bg-lime"
                          : "border-lime bg-transparent text-lime",
                      )}
                    >
                      <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                    </span>
                    <span className={panelIndex === 0 ? "text-smoke" : "text-cream/80"}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              {panelIndex === 0 ? (
                <div className="mt-auto pt-10 sm:pt-12">
                  <div className="mx-auto max-w-xs -rotate-1 overflow-hidden rounded-2xl border-2 border-ink bg-cream shadow-hard-xs">
                    <div className="relative aspect-[4/3] border-b-2 border-ink">
                      <Image
                        src="/images/studio/creator-studio.jpg"
                        alt="A creator's home recording setup, ready for a course lesson"
                        fill
                        sizes="(max-width: 768px) 80vw, 320px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <p className="text-xs font-bold text-ink">Course studio</p>
                      <span className="rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[10px] font-bold">
                        Draft · autosaved
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-6">
                  <CourseCard
                    course={MOCK_CREATORS[0].courses[0]}
                    className="mx-auto max-w-xs rotate-1 text-ink"
                  />
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.15}>
        <div className="mt-10 text-center">
          <Button href="/features" variant="outline">
            Every feature, in detail
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing preview
// ---------------------------------------------------------------------------

export function PricingPreviewSection() {
  return (
    <section className="border-t-2 border-ink bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <Reveal className="min-w-0">
            <SectionHeader
              eyebrow="Pricing"
              title={
                <>
                  One plan.{" "}
                  <span className="font-editorial font-normal text-accent italic">
                    Zero rupees.
                  </span>
                </>
              }
              lede="There is no Pro tier hiding the good stuff. Every creator gets every feature, free, forever. We earn a flat 8% commission — only on successful eligible course sales."
            />
            <ul className="mt-6 space-y-2.5 text-sm font-semibold text-ink">
              {[
                "No monthly fee, setup fee, or listing fee",
                "No per-learner or per-course charges",
                "No paid tiers — the free plan is the whole product",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button href="/pricing" variant="ink">
                The full pricing breakdown
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="min-w-0">
            <PlanCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ preview
// ---------------------------------------------------------------------------

export function FaqPreviewSection() {
  const items = [FAQS[0].items[0], FAQS[0].items[1], ...FAQS[1].items.slice(0, 2), FAQS[3].items[0]];
  return (
    <section className="border-t-2 border-ink bg-parchment">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <SectionHeader
            align="center"
            eyebrow="Questions"
            title={
              <>
                Asked in{" "}
                <span className="font-editorial font-normal text-accent italic">
                  every
                </span>{" "}
                DM
              </>
            }
          />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 rounded-3xl border-2 border-ink bg-white px-5 shadow-hard-sm sm:px-8">
            <Accordion items={items} />
          </div>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-8 text-center">
            <Button href="/faq" variant="outline">
              All questions
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
