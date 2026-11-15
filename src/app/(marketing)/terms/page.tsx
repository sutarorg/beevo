import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing your use of Beevo, one-time credit pack purchases, 10-minute project limits, acceptable content standards, and downloadable MP4 usage rights.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <section className="bg-beevo-canvas py-10 md:py-16">
      <div className="beevo-container max-w-4xl">
        <Breadcrumbs items={[{ name: "Terms of Service", href: "/terms" }]} />
        <Eyebrow>Legal Terms</Eyebrow>
        <h1 className="mt-3.5 font-display text-[clamp(2rem,3.4vw,2.75rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-beevo-ink">
          Terms of Service
        </h1>
        <p className="mt-3 text-[13.5px] font-semibold text-beevo-muted">
          Effective Date: November 15, 2026
        </p>

        <div className="mt-8 space-y-7 rounded-[22px] border border-beevo-border bg-white p-6 text-[15px] leading-[1.72] text-beevo-body shadow-beevo-card sm:p-9">
          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              1. Scope of Service
            </h2>
            <p className="mt-2">
              Beevo provides a web-based illustrated cartoon storytelling and explainer video
              creation platform. By creating an account or purchasing credits, you agree to these
              Terms of Service and our{" "}
              <Link
                href="/privacy"
                className="font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/refund-policy"
                className="font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4"
              >
                Refund Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              2. One-Time Credit Packs &amp; Metering
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Beevo operates on one-time credit pack purchases (Starter ₹299 / 300 credits,
                Creator ₹599 / 800 credits, Studio ₹899 / 1,500 credits) with no recurring
                subscription charges.
              </li>
              <li>
                Video rendering is metered at <strong className="text-beevo-ink">100 credits per minute</strong>{" "}
                (<strong className="text-beevo-ink">25 credits per 15 seconds</strong>).
              </li>
              <li>
                Credits may be split across multiple projects, with a maximum single-project
                duration of <strong className="text-beevo-ink">10 minutes</strong>.
              </li>
              <li>
                Under Beevo&apos;s published credit policy, purchased credits do not expire while
                your account remains in good standing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              3. Content Ownership &amp; Acceptable Use
            </h2>
            <p className="mt-2">
              You retain responsibility for the scripts and prompts you submit. Subject to payment
              of applicable credit packs and compliance with these terms, you may download and use
              your finished MP4 videos for educational, creative, social, and business purposes.
              You must not use Beevo to generate unlawful, defamatory, infringing, deceptive,
              abusive, or harmful content, or attempt to circumvent platform safety and rate
              limits.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              4. Service Availability &amp; Failed Generations
            </h2>
            <p className="mt-2">
              Because Beevo orchestrates third-party AI engines and cloud rendering infrastructure,
              occasional processing errors can occur. When a system or pipeline error prevents a
              project from completing, credits reserved for that failed generation are restored to
              your Beevo balance automatically as detailed in our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              5. Contact
            </h2>
            <p className="mt-2">
              Questions regarding these terms may be submitted anytime through our{" "}
              <Link
                href="/contact"
                className="font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4"
              >
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
