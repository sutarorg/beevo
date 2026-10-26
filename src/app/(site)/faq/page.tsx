import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/config";
import { FAQS } from "@/lib/content";
import { faqPageJsonLd, createPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/marketing/blocks";
import { RelatedLinks } from "@/components/marketing/related-links";
import { Button } from "@/components/ui/button";
import { Accordion, Reveal } from "@/components/ui/motion";

export const metadata: Metadata = createPageMetadata({
  title: "Creator FAQ — plans, payouts & refunds",
  description:
    "Answers about Beevo: the free plan, the 8% commission, our no-marketplace model, payouts, course features, and the refund policy.",
  path: "/faq",
  keywords: ["Beevo FAQ", "creator payouts", "course refund policy India"],
});

export default function FaqPage() {
  return (
    <>
      <JsonLd id="beevo-faq-structured-data" data={faqPageJsonLd(FAQS)} />
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            Everything people ask{" "}
            <span className="font-editorial font-normal text-accent italic">
              before
            </span>{" "}
            they start
          </>
        }
        lede="Straight answers about the plan, the commission, the no-marketplace thing, and where your money and content live."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="space-y-12">
          {FAQS.map((group, groupIndex) => (
            <Reveal key={group.group} delay={groupIndex * 0.04}>
              <div>
                <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-ink">
                  <span className="font-editorial text-accent italic">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  {group.group}
                </h2>
                <div className="mt-4 rounded-3xl border-2 border-ink bg-white px-5 shadow-hard-sm sm:px-8">
                  <Accordion items={group.items} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 rounded-3xl border-2 border-ink bg-ink p-8 text-center text-cream shadow-hard sm:p-10">
            <LifeBuoy className="mx-auto size-8 text-lime" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight">
              Still stuck?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-cream/70">
              Write to us with anything — commission maths, course setup, payout
              questions. A human replies.
            </p>
            <Button href={`mailto:${SUPPORT_EMAIL}`} variant="lime" className="mt-6">
              Email {SUPPORT_EMAIL}
            </Button>
          </div>
        </Reveal>
      </section>

      <RelatedLinks
        links={[
          {
            href: "/pricing",
            label: "Pricing",
            description: "The complete plan: ₹0/month with a flat 8% on successful sales.",
          },
          {
            href: "/how-it-works",
            label: "How it works",
            description: "Profile → course → share link → get paid, in four steps.",
          },
          {
            href: "/refund-policy",
            label: "Refund policy",
            description: "How course purchases and statutory remedies work at Beevo.",
          },
        ]}
      />
    </>
  );
}
