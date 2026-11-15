import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  Clapperboard,
  Coins,
  Film,
  Image as ImageIcon,
  Layers,
  Mic,
  Music,
  Palette,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { HeroSection } from "@/components/home/HeroSection";
import { ExampleVideosSection } from "@/components/home/ExampleVideosSection";
import { PricingSection } from "@/components/home/PricingSection";
import { VisualStyleShowcase } from "@/components/home/VisualStyleShowcase";
import { CreativeControlsPreview } from "@/components/home/CreativeControlsPreview";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import {
  JsonLd,
  buildFaqSchema,
  buildSoftwareApplicationSchema,
} from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";
import {
  BENEFIT_STRIP_ITEMS,
  CORE_FEATURE_CARDS,
  FAQ_ITEMS,
  PRODUCT_PIPELINE_STAGES,
  THREE_STEPS,
  USE_CASE_GROUPS,
  WORKFLOW_COMPARISON_ROWS,
} from "@/lib/beevo-data";

export const metadata = createPageMetadata({
  title: "Beevo — Turn Your Ideas Into Animated Cartoon Videos",
  description:
    "Describe an idea or paste your script. Beevo creates a complete illustrated cartoon storytelling video with dynamic storyboards, consistent characters, natural voiceover, smooth motion, and licensed music.",
  path: "/",
});

function BenefitIcon({ icon }: { icon: (typeof BENEFIT_STRIP_ITEMS)[number]["icon"] }) {
  switch (icon) {
    case "storyboard":
      return <Clapperboard className="h-5 w-5 text-beevo-ink" aria-hidden="true" />;
    case "illustrations":
      return <ImageIcon className="h-5 w-5 text-beevo-ink" aria-hidden="true" />;
    case "voiceover":
      return <AudioLines className="h-5 w-5 text-beevo-ink" aria-hidden="true" />;
    case "credits":
      return <Coins className="h-5 w-5 text-beevo-ink" aria-hidden="true" />;
  }
}

function FeatureIcon({ icon }: { icon: (typeof CORE_FEATURE_CARDS)[number]["icon"] }) {
  switch (icon) {
    case "sparkles":
      return <Sparkles className="h-4 w-4 text-beevo-ink" aria-hidden="true" />;
    case "motion":
      return <Wand2 className="h-4 w-4 text-beevo-ink" aria-hidden="true" />;
    case "voice":
      return <Mic className="h-4 w-4 text-beevo-ink" aria-hidden="true" />;
    case "music":
      return <Music className="h-4 w-4 text-beevo-ink" aria-hidden="true" />;
  }
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildSoftwareApplicationSchema()} />
      <JsonLd data={buildFaqSchema(FAQ_ITEMS)} />

      {/* SECTION 1 — HERO (Reference-matched Split Composition) */}
      <HeroSection />

      {/* SECTION 2 — OVERLAPPING BENEFIT STRIP (4 Factual Pillars, Zero Vanity Stats) */}
      <section aria-label="Core Beevo benefits" className="relative z-20 -mt-5 md:-mt-14 lg:-mt-[62px]">
        <div className="beevo-container">
          <div className="rounded-[18px] border border-beevo-border bg-white shadow-beevo">
            <ul className="grid grid-cols-2 divide-y divide-beevo-border/70 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
              {BENEFIT_STRIP_ITEMS.map((item, idx) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-4 sm:gap-3.5 sm:px-5 sm:py-5 ${
                    idx % 2 === 1 ? "border-l border-beevo-border/70 lg:border-l-0" : ""
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-beevo-cream text-beevo-ink ring-1 ring-beevo-border-warm">
                    <BenefitIcon icon={item.icon} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[13.5px] font-extrabold leading-tight text-beevo-ink sm:text-[14.5px]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] font-medium leading-snug text-beevo-muted sm:text-[12px]">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURE INTRODUCTION (Left Intro + 4 Compact White Cards) */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="bg-beevo-canvas py-14 md:py-[66px]"
      >
        <div className="beevo-container">
          <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-6">
            {/* Left Intro (~29%) */}
            <div className="lg:col-span-4 xl:col-span-3">
              <Eyebrow>Why creators love Beevo</Eyebrow>
              <h2
                id="features-heading"
                className="mt-3.5 font-display text-[clamp(1.65rem,2.45vw,2.05rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                Everything you need,{" "}
                <span className="relative inline-block text-beevo-honey-display">
                  powered by AI.
                  {/* Subtle hand-drawn honey underline matching reference */}
                  <svg
                    viewBox="0 0 180 12"
                    fill="none"
                    aria-hidden="true"
                    className="mt-0.5 h-[7px] w-full text-beevo-yellow"
                  >
                    <path
                      d="M2 8.5C44 2.5 118 2 178 7.5"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h2>
            </div>

            {/* Right Four Compact Feature Cards (~71%) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4 xl:col-span-9">
              {CORE_FEATURE_CARDS.map((card) => (
                <article
                  key={card.id}
                  className="flex flex-col rounded-[16px] border border-beevo-border bg-white p-4 shadow-beevo-card transition-transform duration-200 hover:-translate-y-0.5 sm:p-[18px]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-beevo-yellow shadow-[0_2px_8px_rgba(242,184,0,0.28)]">
                    <FeatureIcon icon={card.icon} />
                  </span>
                  <h3 className="mt-3.5 font-display text-[14.5px] font-extrabold leading-snug text-beevo-ink">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] font-medium leading-[1.55] text-beevo-muted">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS (Full-Width Warm Cream Band + 3 Numbered Step Cards) */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="bg-gradient-to-b from-[#FFF9E9] to-[#FFF5DC] py-14 md:py-[68px]"
      >
        <div className="beevo-container">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-7">
            {/* Left Intro + Bee Flight-Path Accent (~28%) */}
            <div className="lg:col-span-3">
              <Eyebrow>Simple. Fast. Magical.</Eyebrow>
              <h2
                id="how-heading"
                className="mt-3.5 font-display text-[clamp(1.7rem,2.55vw,2.1rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-beevo-ink"
              >
                Create in <span className="text-beevo-honey-display">3 easy</span> steps
              </h2>

              {/* Inline SVG Dashed Loop Flight Path + Real 3D Flying Bee Cutout */}
              <div
                aria-hidden="true"
                className="relative mt-6 hidden h-[92px] w-full max-w-[230px] lg:block"
              >
                <svg
                  viewBox="0 0 210 92"
                  fill="none"
                  className="h-full w-full text-beevo-ink/45"
                >
                  <path
                    d="M8 66 C 48 92, 118 82, 110 56 C 103 36, 78 46, 86 64 C 95 82, 134 74, 152 46"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeDasharray="4 4.5"
                    strokeLinecap="round"
                  />
                </svg>
                <Image
                  src="/images/beevo/bee-flight-doodle.webp"
                  alt=""
                  width={120}
                  height={100}
                  className="pointer-events-none absolute -right-1 top-1 h-auto w-[66px] object-contain"
                />
              </div>
            </div>

            {/* Right Three Step Cards with Overlapping Number Circles & Dashed Arrows (~72%) */}
            <div className="lg:col-span-9">
              <ol className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
                {THREE_STEPS.map((step, index) => (
                  <li key={step.number} className="relative flex flex-col">
                    {/* Dashed horizontal arrow connector on desktop between Step 1->2 and 2->3 */}
                    {index < THREE_STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-[21px] top-1/2 z-20 hidden -translate-y-1/2 items-center md:flex"
                      >
                        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
                          <line
                            x1="1"
                            y1="7"
                            x2="16"
                            y2="7"
                            stroke="#B8AE99"
                            strokeWidth="1.6"
                            strokeDasharray="3 3"
                          />
                          <path
                            d="M14.5 3.5L19 7L14.5 10.5"
                            stroke="#B8AE99"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}

                    {/* Vertical dotted connector on mobile */}
                    {index < THREE_STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-6 left-7 z-10 h-6 border-l-2 border-dashed border-beevo-honey/55 md:hidden"
                      />
                    )}

                    <div className="relative flex h-full flex-col rounded-[18px] border border-beevo-border bg-white px-5 pb-6 pt-5 shadow-beevo-card">
                      {/* Overlapping Yellow Number Circle Badge */}
                      <span
                        aria-hidden="true"
                        className="absolute -left-2.5 -top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-beevo-yellow font-display text-[13.5px] font-extrabold text-beevo-ink shadow-[0_3px_10px_rgba(242,184,0,0.38)] ring-2 ring-[#FFF9E9]"
                      >
                        {step.number}
                      </span>

                      {/* Centered Isolated 3D Prop Illustration */}
                      <div className="flex h-[126px] items-center justify-center px-2">
                        <Image
                          src={step.image}
                          alt={step.imageAlt}
                          width={220}
                          height={158}
                          sizes="(max-width: 768px) 60vw, 210px"
                          className="h-full max-h-[118px] w-auto object-contain"
                        />
                      </div>

                      <h3 className="mt-3 font-display text-[16px] font-extrabold text-beevo-ink">
                        <span className="sr-only">Step {step.number}: </span>
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-[13px] font-medium leading-[1.58] text-beevo-muted">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — EXAMPLE VIDEOS (4 Equal 16:9 Illustrative Demos + Modal) */}
      <ExampleVideosSection />

      {/* SECTION 6 — PRICING (Reference Split Intro + 3 Confirmed INR Credit Pack Cards) */}
      <PricingSection />

      {/* SECTION 7 — INTELLIGENT STORYBOARD (Editorial Two-Column Split, White + Cream Inset) */}
      <section
        aria-labelledby="storyboard-heading"
        className="border-t border-beevo-border/70 bg-beevo-canvas py-14 md:py-[72px]"
      >
        <div className="beevo-container">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Editorial Storyboard Visual Panel */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-[22px] border border-beevo-border bg-beevo-cream/65 p-3 shadow-beevo-card sm:p-4">
                <div className="relative aspect-[1376/768] w-full overflow-hidden rounded-[16px] bg-white">
                  <Image
                    src="/images/beevo/intelligent-storyboard.webp"
                    alt="Five sequential 3D Beevo cartoon storyboard cards arranged left to right showing consistent character progression"
                    fill
                    sizes="(max-width: 1024px) 94vw, 560px"
                    className="object-cover"
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 px-1 text-center text-[11.5px] font-bold text-beevo-body">
                  <span className="rounded-[10px] bg-white/90 px-2 py-2 border border-beevo-border/70">
                    Dynamic scene count
                  </span>
                  <span className="rounded-[10px] bg-white/90 px-2 py-2 border border-beevo-border/70">
                    Consistent cast
                  </span>
                  <span className="rounded-[10px] bg-white/90 px-2 py-2 border border-beevo-border/70">
                    Real voice timing
                  </span>
                </div>
              </div>
            </div>

            {/* Editorial Explanation */}
            <div className="lg:col-span-6">
              <Eyebrow>Intelligent Storyboard</Eyebrow>
              <h2
                id="storyboard-heading"
                className="mt-3.5 font-display text-[clamp(1.75rem,2.7vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                One story.{" "}
                <span className="text-beevo-honey-display">
                  The right visuals at every moment.
                </span>
              </h2>
              <p className="mt-4 text-[15px] leading-[1.68] text-beevo-body">
                Instead of chopping your narration into rigid, mechanical 5-second slides, Beevo
                reads the meaning of each spoken line, spots real narrative beats, and assigns
                scene changes using actual ElevenLabs narration timestamps.
              </p>

              <p className="mt-4 rounded-[14px] border border-beevo-border-warm bg-beevo-cream/80 px-4 py-3 font-display text-[14.5px] font-extrabold text-beevo-ink">
                Beevo decides how many illustrations your story needs.
              </p>

              <ul className="mt-5 space-y-2.5 text-[14px] font-medium text-beevo-body">
                {[
                  "Parses your narration into distinct visual scenes and transitions",
                  "Generates consistent cartoon character references before scene artwork",
                  "Synchronizes scene duration directly to spoken timestamp alignment",
                  "Applies your selected pacing—from calm storybook to brisk explainer",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
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
          </div>
        </div>
      </section>

      {/* SECTION 8 — COMPLETE PRODUCT WORKFLOW (7-Stage Pipeline) */}
      <section
        aria-labelledby="pipeline-heading"
        className="bg-beevo-cream/65 py-14 md:py-[72px]"
      >
        <div className="beevo-container">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>End-to-End Pipeline</Eyebrow>
              <h2
                id="pipeline-heading"
                className="mt-3.5 font-display text-[clamp(1.75rem,2.7vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                From raw prompt to finished MP4,{" "}
                <span className="text-beevo-honey-display">step by step.</span>
              </h2>
            </div>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-bold text-beevo-ink hover:text-beevo-honey-text"
            >
              Explore technical pipeline
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ol className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-7">
            {PRODUCT_PIPELINE_STAGES.map((stage, idx) => (
              <li
                key={stage.step}
                className="relative flex flex-col rounded-[16px] border border-beevo-border bg-white p-4 shadow-beevo-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-beevo-yellow font-display text-[11.5px] font-extrabold text-beevo-ink">
                    {stage.step}
                  </span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-beevo-honey-text">
                    {stage.engine}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[14.5px] font-extrabold text-beevo-ink">
                  {stage.title}
                </h3>
                <p className="mt-1.5 text-[12px] font-medium leading-[1.55] text-beevo-muted">
                  {stage.description}
                </p>
                {idx < PRODUCT_PIPELINE_STAGES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-beevo-border bg-[#FFF9E9] p-0.5 text-beevo-honey-text lg:flex"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECTION 9 — WHY CARTOON STORYTELLING (Open Editorial Two-Column Layout — Not Another Card Grid) */}
      <section aria-labelledby="why-storytelling-heading" className="bg-beevo-canvas py-14 md:py-[72px]">
        <div className="beevo-container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <Eyebrow>Why Illustrated Storytelling</Eyebrow>
              <h2
                id="why-storytelling-heading"
                className="mt-3.5 font-display text-[clamp(1.75rem,2.7vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                Visual clarity that stock clips can&apos;t match.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.68] text-beevo-body">
                Illustrated cartoon storytelling lets you show abstract ideas, friendly guides,
                historical moments, and step-by-step processes cleanly—without filming sets,
                hiring animators, or stitching together mismatched stock footage.
              </p>
              <Link
                href="/features"
                className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-bold text-beevo-ink hover:text-beevo-honey-text"
              >
                See all Beevo capabilities
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="divide-y divide-beevo-border border-y border-beevo-border lg:col-span-7">
              {[
                {
                  icon: BookOpen,
                  title: "Clear visual explanations for any age",
                  body: "Pairing calm narration with purpose-built scene artwork helps learners and viewers follow multi-step ideas without visual distractions.",
                },
                {
                  icon: Users,
                  title: "Reusable, recognizable characters",
                  body: "Generate a consistent character reference once and carry that familiar host across an entire episode or multi-part lesson series.",
                },
                {
                  icon: Palette,
                  title: "Flexible visual styles without starting over",
                  body: "Match the medium to the message—3D Cartoon for kids stories, Storybook for fables, or Flat Vector for clean business briefings.",
                },
                {
                  icon: Film,
                  title: "Composed motion, never glitchy raw video",
                  body: "By animating crisp original illustrations with smooth camera motion, transitions, and timed captions, multi-minute videos stay coherent from frame one to ten minutes.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-4 py-5">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beevo-cream text-beevo-honey-text ring-1 ring-beevo-border-warm"
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-[15.5px] font-extrabold text-beevo-ink">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[14px] leading-[1.62] text-beevo-body">
                        {item.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — VISUAL STYLE SHOWCASE (8 Supported Styles, Same Meadow Subject) */}
      <VisualStyleShowcase />

      {/* SECTION 11 — USE CASES (Distinct Editorial Compositions) */}
      <section aria-labelledby="use-cases-heading" className="bg-beevo-canvas py-14 md:py-[72px]">
        <div className="beevo-container">
          <div className="max-w-2xl">
            <Eyebrow>Built For Real Storytellers</Eyebrow>
            <h2
              id="use-cases-heading"
              className="mt-3.5 font-display text-[clamp(1.75rem,2.7vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
            >
              Where Beevo fits best
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-beevo-body">
              Whether you teach science in a classroom, narrate weekly stories on YouTube, or
              explain workflows to a growing team, Beevo adapts to your script and audience.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {USE_CASE_GROUPS.map((group, idx) => (
              <article
                key={group.id}
                className="overflow-hidden rounded-[20px] border border-beevo-border bg-white shadow-beevo-card"
              >
                <div className="grid grid-cols-1 items-center lg:grid-cols-12">
                  <div
                    className={`relative aspect-video w-full overflow-hidden bg-beevo-cream lg:col-span-5 ${
                      idx % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={group.image}
                      alt={group.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 94vw, 480px"
                      className="object-cover"
                    />
                  </div>
                  <div
                    className={`p-6 sm:p-8 lg:col-span-7 ${idx % 2 === 1 ? "lg:order-1" : ""}`}
                  >
                    <div className="flex flex-wrap gap-2">
                      {group.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-beevo-cream px-3 py-1 text-[11.5px] font-bold text-beevo-honey-text"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-3 font-display text-[20px] font-extrabold leading-snug text-beevo-ink sm:text-[22px]">
                      {group.title}
                    </h3>
                    <p className="mt-2.5 max-w-xl text-[14.5px] leading-[1.66] text-beevo-body">
                      {group.summary}
                    </p>
                    <Link
                      href={group.href}
                      className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-bold text-beevo-ink transition-colors hover:text-beevo-honey-text"
                    >
                      Explore {group.shortTitle}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 12 — CREATIVE CONTROLS (Interactive Controls Schematic) */}
      <CreativeControlsPreview />

      {/* SECTION 13 — WORKFLOW COMPARISON (Objective Manual vs Beevo Comparison) */}
      <section
        aria-labelledby="comparison-heading"
        className="bg-beevo-cream/65 py-14 md:py-[72px]"
      >
        <div className="beevo-container">
          <div className="max-w-2xl">
            <Eyebrow>Workflow Comparison</Eyebrow>
            <h2
              id="comparison-heading"
              className="mt-3.5 font-display text-[clamp(1.75rem,2.7vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
            >
              Manual assembly vs.{" "}
              <span className="text-beevo-honey-display">Beevo&apos;s assisted pipeline</span>
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-beevo-body">
              An objective look at how producing an illustrated explainer video compares step by
              step when handled manually versus inside Beevo.
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-[20px] border border-beevo-border bg-white shadow-beevo-card">
            <div className="hidden grid-cols-12 border-b border-beevo-border bg-beevo-cream/70 px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-wider text-beevo-muted md:grid">
              <div className="col-span-3">Production Stage</div>
              <div className="col-span-4 pr-4">Traditional Manual Process</div>
              <div className="col-span-5 text-beevo-honey-text">Beevo Assisted Workflow</div>
            </div>
            <div className="divide-y divide-beevo-border">
              {WORKFLOW_COMPARISON_ROWS.map((row) => (
                <div
                  key={row.stage}
                  className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-12 md:gap-4 md:px-6"
                >
                  <div className="flex items-center gap-2 md:col-span-3">
                    <Layers className="h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden="true" />
                    <h3 className="font-display text-[14.5px] font-extrabold text-beevo-ink">
                      {row.stage}
                    </h3>
                  </div>
                  <div className="md:col-span-4 md:pr-4">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-beevo-muted md:hidden">
                      Traditional Manual Process
                    </p>
                    <p className="text-[13.5px] leading-[1.6] text-beevo-muted">{row.manual}</p>
                  </div>
                  <div className="rounded-[12px] bg-beevo-cream/50 p-3 md:col-span-5 md:bg-transparent md:p-0">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-beevo-honey-text md:hidden">
                      Beevo Assisted Workflow
                    </p>
                    <p className="text-[13.5px] font-semibold leading-[1.6] text-beevo-ink">
                      {row.beevo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 14 — FAQ (Accessible Keyboard-Navigable Accordion) */}
      <section id="faq" aria-labelledby="faq-heading" className="bg-beevo-canvas py-14 md:py-[72px]">
        <div className="beevo-container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <Eyebrow>Frequently Asked Questions</Eyebrow>
              <h2
                id="faq-heading"
                className="mt-3.5 font-display text-[clamp(1.75rem,2.6vw,2.15rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                Honest answers before you start.
              </h2>
              <p className="mt-3 text-[14.5px] leading-[1.65] text-beevo-body">
                Clear facts about how Beevo creates illustrated videos, how credits are counted,
                language support, and what happens if a render fails.
              </p>
              <Link
                href="/faq"
                className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-bold text-beevo-ink hover:text-beevo-honey-text"
              >
                Browse full FAQ by category
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="lg:col-span-8">
              <FaqAccordion items={FAQ_ITEMS} defaultOpenId="what-is-beevo" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 15 — FINAL CTA (Warm Cream Panel + Celebratory Beevo Mascot) */}
      <FinalCtaBand />
    </>
  );
}
