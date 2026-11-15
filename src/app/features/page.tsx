import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Captions,
  Check,
  Clapperboard,
  Globe,
  Layers,
  Mic,
  Music,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wand2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { VisualStyleShowcase } from "@/components/home/VisualStyleShowcase";
import { CreativeControlsPreview } from "@/components/home/CreativeControlsPreview";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Features — Storyboards, Consistent Characters, Voiceover & Motion",
  description:
    "Explore every Beevo capability: dynamic AI storyboards, consistent cartoon characters, 8 visual styles, natural ElevenLabs voiceover including English and Hindi, smooth camera motion, captions, and licensed audio.",
  path: "/features",
});

const DEEP_FEATURES = [
  {
    icon: Sparkles,
    title: "Scriptwriting & Idea Expansion",
    description:
      "Start with a single sentence, an outline, or a finished script. OpenAI helps structure clear openings, explanations, and satisfying conclusions tailored for spoken narration.",
    bullets: [
      "Paste complete scripts verbatim or draft from an idea",
      "Clean conversational phrasing designed for voiceover",
      "Projects up to 10 minutes in length",
    ],
  },
  {
    icon: Clapperboard,
    title: "Dynamic Storyboard Intelligence",
    description:
      "Beevo determines how many visual moments your narration genuinely calls for—eliminating jarring repetitive loops or lifeless static slides.",
    bullets: [
      "Analyzes meaning and narrative transitions per sentence",
      "Dynamic scene count matched to story pacing",
      "Supports calm storybook or crisp explainer tempo",
    ],
  },
  {
    icon: UserCheck,
    title: "Consistent Character References",
    description:
      "Powered by fal.ai reference-image editing, Beevo creates visual character anchors before generating scenes so your host or cast stays recognizable throughout.",
    bullets: [
      "Character references established ahead of scene artwork",
      "Cohesive outfits, facial traits, and palette across scenes",
      "Works across all 8 supported visual style families",
    ],
  },
  {
    icon: Mic,
    title: "Natural Voiceover & Real Timestamps",
    description:
      "ElevenLabs generates expressive narration alongside exact spoken alignment timestamps so visual transitions lock tightly to what is being said.",
    bullets: [
      "English, Hindi & active ElevenLabs catalog voices",
      "Adjustable speech speed for learners or fast explainers",
      "True narration-to-scene alignment via Dynamic Timeline",
    ],
  },
  {
    icon: Wand2,
    title: "Camera Motion, Transitions & Captions",
    description:
      "FFmpeg turns your illustrated storyboard into a fluid animated video with smooth pan/zoom camera movements, tasteful transitions, and synchronized captions.",
    bullets: [
      "Smooth pan and zoom camera choreography",
      "Readable timed captions synced to narration",
      "16:9 landscape, 9:16 vertical, and 1:1 square formats",
    ],
  },
  {
    icon: Music,
    title: "Licensed Background Music, SFX & Private Export",
    description:
      "Enhance mood with Beevo's approved licensed music and sound effects library, then preview and download your completed MP4 stored privately on Cloudflare R2.",
    bullets: [
      "Approved licensed audio tracks balanced beneath narration",
      "Subtle scene-appropriate sound effects",
      "Private R2 storage and straightforward MP4 download",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-beevo-canvas pb-12 pt-10 md:pb-16 md:pt-14">
        <div className="beevo-container">
          <Breadcrumbs items={[{ name: "Features", href: "/features" }]} />
          <div className="max-w-3xl">
            <Eyebrow>Complete Creation Suite</Eyebrow>
            <h1 className="mt-3.5 font-display text-[clamp(2rem,3.6vw,2.9rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
              Everything required for{" "}
              <span className="text-beevo-honey-display">cohesive illustrated storytelling.</span>
            </h1>
            <p className="mt-4 text-[15.5px] leading-[1.68] text-beevo-body">
              Every Beevo credit pack gives you full access to dynamic storyboarding, consistent
              cartoon artwork, natural voiceover synchronization, camera motion, captions, and
              licensed audio—without complex desktop timeline editors or monthly subscriptions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/get-started" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
                Start Creating
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/how-it-works" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
                See How the Pipeline Works
              </Link>
            </div>
          </div>

          {/* Deep Feature Grid */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DEEP_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <article
                  key={feat.title}
                  className="flex flex-col rounded-[20px] border border-beevo-border bg-white p-6 shadow-beevo-card"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink shadow-[0_2px_8px_rgba(242,184,0,0.28)]">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 font-display text-[17.5px] font-extrabold text-beevo-ink">
                    {feat.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-[1.62] text-beevo-body">
                    {feat.description}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-beevo-border/80 pt-4 text-[13px] font-semibold text-beevo-body">
                    {feat.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-beevo-honey-text"
                          aria-hidden="true"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          {/* Quick Spec Highlights Bar */}
          <div className="mt-8 grid grid-cols-2 gap-3 rounded-[18px] border border-beevo-border bg-beevo-cream/65 p-5 sm:grid-cols-4">
            {[
              { icon: Layers, label: "8 Visual Styles", sub: "3D, 2D, Anime, Comic & more" },
              { icon: Globe, label: "English & Hindi+", sub: "Supported voice catalog" },
              { icon: Captions, label: "Synced Captions", sub: "Aligned to spoken timestamps" },
              { icon: ShieldCheck, label: "Private Storage", sub: "Cloudflare R2 MP4 delivery" },
            ].map((spec) => {
              const Icon = spec.icon;
              return (
                <div key={spec.label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden="true" />
                  <div>
                    <p className="font-display text-[13.5px] font-extrabold text-beevo-ink">
                      {spec.label}
                    </p>
                    <p className="text-[12px] text-beevo-muted">{spec.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <VisualStyleShowcase />
      <CreativeControlsPreview />
      <FinalCtaBand />
    </>
  );
}
