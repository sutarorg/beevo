import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Film, Monitor, Palette, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Content Creators & YouTube Cartoon Storytelling",
  description:
    "Produce illustrated YouTube stories, explainer episodes up to 10 minutes, and vertical 9:16 social clips with consistent cartoon characters, 8 visual styles, and simple one-time credits.",
  path: "/use-cases/content-creators",
});

export default function ContentCreatorsUseCasePage() {
  return (
    <>
      <section className="bg-beevo-canvas pb-12 pt-10 md:pb-16 md:pt-14">
        <div className="beevo-container">
          <Breadcrumbs
            items={[
              { name: "Use Cases", href: "/use-cases/education" },
              { name: "Content Creators", href: "/use-cases/content-creators" },
            ]}
          />

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Eyebrow>Use Case &middot; Content Creators</Eyebrow>
              <h1 className="mt-3.5 font-display text-[clamp(2rem,3.5vw,2.85rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
                Build original cartoon stories{" "}
                <span className="text-beevo-honey-display">without a full studio.</span>
              </h1>
              <p className="mt-4 text-[15.5px] leading-[1.68] text-beevo-body">
                Independent YouTube storytellers, explainer channels, and short-form creators use
                Beevo to move from script to finished illustrated MP4—complete with consistent
                characters, smooth camera motion, timed captions, and licensed background music.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/get-started" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
                  Start Your Next Episode
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/features" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
                  Explore 8 Visual Styles
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-[22px] border border-beevo-border bg-beevo-cream shadow-beevo-card">
                <Image
                  src="/images/beevo/usecase-creators.webp"
                  alt="Beevo creator storyboard timeline showing consistent 3D cartoon frames"
                  fill
                  priority
                  sizes="(max-width: 1024px) 94vw, 560px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: Monitor,
                title: "16:9 YouTube, 9:16 Shorts & 1:1 Feeds",
                body: "Render full multi-minute landscape episodes up to 10 minutes or tight 30–60 second vertical explainers using the exact same credit balance.",
              },
              {
                icon: Palette,
                title: "Signature Visual Identity for Your Channel",
                body: "Pick from 3D Cartoon, 2D Cartoon, Anime Inspired, Comic Book, Clay Animation, Storybook, Watercolor, or Flat Vector to establish a recognizable channel look.",
              },
              {
                icon: Film,
                title: "Narration-Driven Dynamic Pacing",
                body: "No tedious frame-by-frame keyframing. Beevo aligns visual scene cuts, smooth pan/zoom motion, and captions straight to real ElevenLabs speech timing.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[18px] border border-beevo-border bg-white p-6 shadow-beevo-card"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 font-display text-[17px] font-extrabold text-beevo-ink">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-[1.64] text-beevo-body">{item.body}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 rounded-[20px] border border-beevo-border bg-beevo-cream/65 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-beevo-honey-text">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Predictable Creator Economics
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-3 text-[14px] font-semibold text-beevo-body sm:grid-cols-2">
              {[
                "No wasted subscription when you take a break between uploads",
                "Clear metering: 100 credits = 1 minute (25 credits = 15 seconds)",
                "Consistent character references keep recurring hosts recognizable across episodes",
                "Download ready-to-publish MP4 files with synchronized captions and licensed music",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FinalCtaBand
        heading="Turn your next script into a watchable cartoon episode."
        subcopy="Choose a one-time credit pack and publish illustrated stories without hiring an external animation studio."
      />
    </>
  );
}
