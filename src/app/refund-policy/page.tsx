import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Refund & Failed-Generation Credit Policy",
  description:
    "Transparent Beevo policy covering automatic credit restoration on failed video generations, non-expiring credits, and refund eligibility on unused credit packs.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <section className="bg-beevo-canvas py-10 md:py-16">
      <div className="beevo-container max-w-4xl">
        <Breadcrumbs items={[{ name: "Refund Policy", href: "/refund-policy" }]} />
        <Eyebrow>Billing Transparency</Eyebrow>
        <h1 className="mt-3.5 font-display text-[clamp(2rem,3.4vw,2.75rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-beevo-ink">
          Refund &amp; Credit Protection Policy
        </h1>
        <p className="mt-3 text-[13.5px] font-semibold text-beevo-muted">
          Effective Date: November 15, 2026
        </p>

        <div className="mt-6 flex items-start gap-3.5 rounded-[18px] border border-beevo-border-warm bg-beevo-cream/80 p-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beevo-yellow text-beevo-ink">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-[14.5px] font-semibold leading-relaxed text-beevo-ink">
            Core commitment: If a video generation fails due to a technical or pipeline error before
            producing a completed MP4, your reserved credits are automatically restored back to your
            account balance.
          </p>
        </div>

        <div className="mt-7 space-y-7 rounded-[22px] border border-beevo-border bg-white p-6 text-[15px] leading-[1.72] text-beevo-body shadow-beevo-card sm:p-9">
          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              1. Automatic Credit Restoration on Failed Renders
            </h2>
            <p className="mt-2">
              Whenever you start a video generation job, Beevo reserves the exact credit amount
              needed based on target duration (100 credits per minute / 25 credits per 15 seconds).
              If any upstream model call (script, illustration, narration) or FFmpeg composition
              step fails and cannot deliver your finished video, the reserved credits are credited
              back automatically—no support ticket required.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              2. Refund Eligibility on Unused One-Time Credit Packs
            </h2>
            <p className="mt-2">
              If you purchased a Starter (₹299), Creator (₹599), or Studio (₹899) credit pack and
              have not used any credits from that pack, you may request a full refund to your
              original payment method within <strong className="text-beevo-ink">7 days</strong> of
              purchase.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              3. Partially Used Packs &amp; Duplicate Charges
            </h2>
            <p className="mt-2">
              Because AI illustration, narration synthesis, and cloud video composition incur
              immediate real-time processing costs once a video completes, credits already spent on
              successfully rendered MP4 downloads are generally non-refundable. However, accidental
              duplicate charges or verified billing errors are always refunded promptly in full.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              4. Non-Expiring Credits &amp; Zero Subscriptions
            </h2>
            <p className="mt-2">
              Beevo sells one-time credit packs only—there are no automatic renewals to cancel.
              Purchased credits do not expire under our published policy, so unused balance remains
              ready for future stories.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[19px] font-extrabold text-beevo-ink">
              5. How to Request a Billing Review
            </h2>
            <p className="mt-2">
              Submit your purchase email, order date, and issue description via our{" "}
              <Link
                href="/contact"
                className="font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4"
              >
                Contact page
              </Link>
              . Approved refunds are initiated to the original payment method according to standard
              payment-gateway timelines.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
