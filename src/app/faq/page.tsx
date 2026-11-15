import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { JsonLd, buildFaqSchema } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";
import { FAQ_ITEMS } from "@/lib/beevo-data";

export const metadata = createPageMetadata({
  title: "FAQ — Answers About Beevo Credits, Styles, Sync & Workflow",
  description:
    "Clear, factual answers about how Beevo creates illustrated cartoon storytelling videos, dynamic scene counts, ElevenLabs voice sync, Hindi support, credit pricing, and failed-render protection.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={buildFaqSchema(FAQ_ITEMS)} />

      <section className="bg-beevo-canvas py-10 md:py-16">
        <div className="beevo-container">
          <Breadcrumbs items={[{ name: "FAQ", href: "/faq" }]} />

          <div className="max-w-2xl">
            <Eyebrow>Knowledge Base</Eyebrow>
            <h1 className="mt-3.5 font-display text-[clamp(2rem,3.6vw,2.85rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
              Frequently Asked Questions
            </h1>
            <p className="mt-3.5 text-[15.5px] leading-[1.68] text-beevo-body">
              Filter by topic to read straight, accurate answers about Beevo&apos;s production
              architecture, visual styles, language availability, one-time credits, and policies.
            </p>
          </div>

          <div className="mt-8 max-w-4xl">
            <FaqAccordion items={FAQ_ITEMS} showCategoryFilter defaultOpenId="what-is-beevo" />
          </div>

          <div className="mt-10 max-w-4xl rounded-[18px] border border-beevo-border bg-beevo-cream/65 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h2 className="font-display text-[17px] font-extrabold text-beevo-ink">
                Still have a specific question?
              </h2>
              <p className="mt-1 text-[14px] text-beevo-body">
                Reach out through our contact form and we&apos;ll help clarify workflow or credit
                details.
              </p>
            </div>
            <Link
              href="/contact"
              className="beevo-btn-secondary mt-4 min-h-[44px] px-5 text-[13.5px] sm:mt-0 sm:shrink-0"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <FinalCtaBand />
    </>
  );
}
