import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Cpu } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExampleVideosSection } from "@/components/home/ExampleVideosSection";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { createPageMetadata } from "@/lib/site";
import {
  ARCHITECTURE_STACK,
  PRODUCT_PIPELINE_STAGES,
  THREE_STEPS,
} from "@/lib/beevo-data";

export const metadata = createPageMetadata({
  title: "How Beevo Works — From Prompt to Synced Cartoon MP4",
  description:
    "See how Beevo converts your idea or script into a dynamic storyboard, consistent cartoon illustrations, timestamp-aligned narration, camera motion, captions, and a downloadable MP4.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero Intro */}
      <section className="bg-beevo-canvas pb-12 pt-10 md:pb-16 md:pt-14">
        <div className="beevo-container">
          <Breadcrumbs items={[{ name: "How It Works", href: "/how-it-works" }]} />
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Eyebrow>Transparent Production Pipeline</Eyebrow>
              <h1 className="mt-3.5 font-display text-[clamp(2rem,3.6vw,2.9rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
                How your script becomes an{" "}
                <span className="text-beevo-honey-display">animated cartoon video.</span>
              </h1>
              <p className="mt-4 text-[15.5px] leading-[1.68] text-beevo-body">
                Beevo does not gamble on unpredictable raw generative video. Instead, it composes
                crisp original cartoon illustrations, real voiceover alignment, smooth camera
                motion, transitions, and licensed audio into a cohesive storytelling MP4 up to 10
                minutes long.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/get-started" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
                  Create Your First Video
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
                  View Credit Packs
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-[22px] border border-beevo-border bg-beevo-cream/65 p-3 shadow-beevo-card">
                <div className="relative aspect-[1376/768] w-full overflow-hidden rounded-[16px] bg-white">
                  <Image
                    src="/images/beevo/intelligent-storyboard.webp"
                    alt="Five sequential 3D Beevo storyboard cards showing consistent scene progression"
                    fill
                    priority
                    sizes="(max-width: 1024px) 94vw, 560px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Simple User Steps */}
      <section className="bg-beevo-cream/75 py-14 md:py-16">
        <div className="beevo-container">
          <div className="max-w-xl">
            <Eyebrow>Simple User Experience</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,2.6vw,2.15rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink">
              What you do in 3 simple steps
            </h2>
          </div>

          <ol className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
            {THREE_STEPS.map((step) => (
              <li
                key={step.number}
                className="relative rounded-[18px] border border-beevo-border bg-white p-6 shadow-beevo-card"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-beevo-yellow font-display text-[13.5px] font-extrabold text-beevo-ink">
                  {step.number}
                </span>
                <div className="mt-3 flex h-[126px] items-center justify-center">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    width={220}
                    height={158}
                    className="h-full max-h-[116px] w-auto object-contain"
                  />
                </div>
                <h3 className="mt-3 font-display text-[17px] font-extrabold text-beevo-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-beevo-body">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Full 7-Stage Pipeline Breakdown */}
      <section className="bg-beevo-canvas py-14 md:py-[72px]">
        <div className="beevo-container">
          <div className="max-w-2xl">
            <Eyebrow>Behind the Scenes</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,2.6vw,2.15rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink">
              The 7-stage storytelling workflow
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-beevo-body">
              Every project moves cleanly from your text input through seven coordinated stages so
              characters remain consistent and visual cuts follow spoken narration naturally.
            </p>
          </div>

          <ol className="mt-8 space-y-4">
            {PRODUCT_PIPELINE_STAGES.map((stage) => (
              <li
                key={stage.step}
                className="grid grid-cols-1 items-center gap-4 rounded-[18px] border border-beevo-border bg-white p-5 shadow-beevo-card md:grid-cols-12"
              >
                <div className="flex items-center gap-3.5 md:col-span-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beevo-yellow font-display text-[14px] font-extrabold text-beevo-ink">
                    {stage.step}
                  </span>
                  <div>
                    <h3 className="font-display text-[16px] font-extrabold text-beevo-ink">
                      {stage.title}
                    </h3>
                    <p className="text-[12px] font-bold text-beevo-honey-text">{stage.engine}</p>
                  </div>
                </div>
                <p className="text-[14.5px] leading-[1.65] text-beevo-body md:col-span-8">
                  {stage.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Real Production Architecture Stack */}
      <section className="bg-beevo-cream/65 py-14 md:py-[72px]">
        <div className="beevo-container">
          <div className="max-w-2xl">
            <Eyebrow>Production Architecture</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,2.6vw,2.15rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink">
              Six specialized engines working in sequence
            </h2>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ARCHITECTURE_STACK.map((item) => (
              <article
                key={item.component}
                className="rounded-[18px] border border-beevo-border bg-white p-5 shadow-beevo-card"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-beevo-cream text-beevo-honey-text ring-1 ring-beevo-border-warm">
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3.5 font-display text-[16px] font-extrabold text-beevo-ink">
                  {item.component}
                </h3>
                <p className="mt-1 text-[12.5px] font-bold text-beevo-honey-text">{item.role}</p>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-beevo-body">{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[16px] border border-beevo-border-warm bg-white px-5 py-4 text-[13.5px] font-semibold text-beevo-body">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
              Dynamic scene count — never rigid fixed image intervals
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
              Standard downloadable MP4 output stored privately on Cloudflare R2
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Storyboard Demo Showcase */}
      <div id="storyboard-demos">
        <ExampleVideosSection />
      </div>

      <FinalCtaBand />
    </>
  );
}
