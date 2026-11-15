import React from "react";
import Link from "next/link";
import { HelpCircle, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ContactForm } from "@/components/contact/ContactForm";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Contact Beevo — Support & Product Inquiries",
  description:
    "Get in touch with Beevo for product questions, credit pack clarifications, classroom inquiries, or technical support.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="bg-beevo-canvas py-10 md:py-16">
      <div className="beevo-container">
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow>Contact Beevo</Eyebrow>
            <h1 className="mt-3.5 font-display text-[clamp(2rem,3.5vw,2.75rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
              We&apos;re here to help with your stories.
            </h1>
            <p className="mt-4 text-[15px] leading-[1.68] text-beevo-body">
              Have a question about Beevo&apos;s one-time credit packs, supported voice languages,
              visual styles, or classroom usage? Send us a message using the form.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-[16px] border border-beevo-border bg-white p-5 shadow-beevo-card">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="h-5 w-5 text-beevo-honey-text" aria-hidden="true" />
                  <h2 className="font-display text-[15px] font-extrabold text-beevo-ink">
                    Quick Self-Service Answers
                  </h2>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-beevo-muted">
                  Many common questions about credit rates, 10-minute project limits, and voice
                  synchronization are answered right away in our FAQ.
                </p>
                <Link
                  href="/faq"
                  className="mt-3 inline-flex min-h-[36px] items-center text-[13.5px] font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4 hover:text-beevo-honey-text"
                >
                  Browse the FAQ
                </Link>
              </div>

              <div className="rounded-[16px] border border-beevo-border-warm bg-beevo-cream/65 p-5">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-beevo-honey-text" aria-hidden="true" />
                  <h2 className="font-display text-[15px] font-extrabold text-beevo-ink">
                    Failed Generation or Refund Question?
                  </h2>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-beevo-body">
                  Credits reserved for failed generations are restored automatically. Review our
                  full credit protection terms anytime.
                </p>
                <Link
                  href="/refund-policy"
                  className="mt-3 inline-flex min-h-[36px] items-center text-[13.5px] font-bold text-beevo-ink underline decoration-beevo-honey underline-offset-4 hover:text-beevo-honey-text"
                >
                  Read Refund Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
