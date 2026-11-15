import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Check, Layers, Presentation, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Business Explainers, Presentations & Team Training Videos",
  description:
    "Create clear illustrated product walkthroughs, onboarding videos, and internal training explainers in Flat Vector, 2D, or 3D styles with Beevo's one-time credit packs.",
  path: "/use-cases/business-explainers",
});

export default function BusinessExplainersUseCasePage() {
  return (
    <>
      <section className="bg-beevo-canvas pb-12 pt-10 md:pb-16 md:pt-14">
        <div className="beevo-container">
          <Breadcrumbs
            items={[
              { name: "Use Cases", href: "/use-cases/education" },
              { name: "Business Explainers", href: "/use-cases/business-explainers" },
            ]}
          />

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Eyebrow>Use Case &middot; Business &amp; Training</Eyebrow>
              <h1 className="mt-3.5 font-display text-[clamp(2rem,3.5vw,2.85rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
                Explain complex workflows with{" "}
                <span className="text-beevo-honey-display">calm visual clarity.</span>
              </h1>
              <p className="mt-4 text-[15.5px] leading-[1.68] text-beevo-body">
                Founders, product managers, and learning teams use Beevo to convert dense manuals,
                onboarding guides, and product pitches into friendly illustrated explainer videos—in
                hours rather than multi-week agency cycles.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/get-started" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
                  Create an Explainer Video
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
                  Compare Studio &amp; Creator Packs
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-[22px] border border-beevo-border bg-beevo-cream shadow-beevo-card">
                <Image
                  src="/images/beevo/usecase-business.webp"
                  alt="Beevo mascot beside a clean business explainer presentation visual"
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
                icon: Presentation,
                title: "Product & Service Walkthroughs",
                body: "Walk prospective customers through how your service works step by step with clean Flat Vector or 3D Cartoon visual storytelling.",
              },
              {
                icon: Briefcase,
                title: "Employee Onboarding & SOP Training",
                body: "Turn internal process handbooks and safety checklists into concise narrated visual modules up to 10 minutes long.",
              },
              {
                icon: Layers,
                title: "Private Cloud Storage & Standard MP4",
                body: "Project assets and completed MP4 files are stored privately on Cloudflare R2 and download cleanly for slide decks, portals, or intranets.",
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
              Why Teams Prefer One-Time Packs
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-3 text-[14px] font-semibold text-beevo-body sm:grid-cols-2">
              {[
                "Studio pack (₹899) covers 15 full minutes of training or explainer video capacity",
                "Zero per-seat SaaS subscriptions sitting idle between quarterly launches",
                "Paste exact approved copy so spoken narration matches your official documentation",
                "Supports English, Hindi, and additional ElevenLabs catalog languages for regional teams",
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
        heading="Make every presentation easier to follow."
        subcopy="Turn your next product brief or training guide into a clear illustrated cartoon explainer video."
      />
    </>
  );
}
