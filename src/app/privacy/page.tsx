import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "How Beevo collects, processes, and protects your account details, story prompts, scripts, generated illustrations, voiceovers, and MP4 videos across our infrastructure.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <section className="bg-beevo-canvas py-10 md:py-16">
      <div className="beevo-container max-w-4xl">
        <Breadcrumbs items={[{ name: "Privacy Policy", href: "/privacy" }]} />
        <Eyebrow>Legal &amp; Privacy</Eyebrow>
        <h1 className="mt-3.5 font-display text-[clamp(2rem,3.4vw,2.75rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-beevo-ink">
          Privacy Policy
        </h1>
        <p className="mt-3 text-[13.5px] font-semibold text-beevo-muted">
          Effective Date: November 15, 2026
        </p>

        <div className="mt-8 space-y-7 rounded-[22px] border border-beevo-border bg-white p-6 text-[15px] leading-[1.72] text-beevo-body shadow-beevo-card sm:p-9">
          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              When you create a Beevo account, purchase a one-time credit pack, or contact support,
              we collect only the information needed to operate the service: your account email
              and authentication identifiers, billing transaction records from our payment
              processor (we never store full payment card numbers directly), and the story prompts,
              scripts, creative preferences, and resulting project files you create inside Beevo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              2. How Your Content Moves Through Our Production Pipeline
            </h2>
            <p className="mt-2">
              To turn your idea or script into a completed animated cartoon video, Beevo transmits
              only the necessary inputs to specialized infrastructure providers strictly for
              generating your project:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-beevo-ink">OpenAI:</strong> processes your prompt or script
                to draft narration and plan dynamic storyboard scenes.
              </li>
              <li>
                <strong className="text-beevo-ink">fal.ai:</strong> generates consistent character
                references and original cartoon illustrations for your storyboard.
              </li>
              <li>
                <strong className="text-beevo-ink">ElevenLabs:</strong> synthesizes voiceover audio
                and returns spoken timestamp alignment data.
              </li>
              <li>
                <strong className="text-beevo-ink">Cloudflare R2:</strong> stores your private
                project assets, narration tracks, and rendered MP4 downloads securely.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              3. Private Asset Storage &amp; Access Controls
            </h2>
            <p className="mt-2">
              Generated illustrations, audio files, and final MP4 videos are stored privately in
              Cloudflare R2 buckets and delivered via time-limited authenticated access. Beevo does
              not publish your private user projects in public galleries or marketing materials
              without explicit written permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              4. Data Retention &amp; Deletion Requests
            </h2>
            <p className="mt-2">
              We retain account details and billing records as required by applicable tax and
              accounting regulations. You may request deletion of your projects or account data at
              any time by contacting us via the{" "}
              <Link
                href="/contact"
                className="font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4 hover:text-beevo-honey-text"
              >
                Contact page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              5. Policy Updates
            </h2>
            <p className="mt-2">
              We may revise this Privacy Policy as Beevo evolves. Material changes will be
              reflected by an updated effective date at the top of this page.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
