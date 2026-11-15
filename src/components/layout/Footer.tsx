import React from "react";
import Link from "next/link";
import { BeevoLogo } from "@/components/brand/BeevoLogo";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Example Videos", href: "/#examples" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Use Cases",
    links: [
      { label: "Education & Kids Learning", href: "/use-cases/education" },
      { label: "Content Creators", href: "/use-cases/content-creators" },
      { label: "Business Explainers", href: "/use-cases/business-explainers" },
    ],
  },
  {
    heading: "Support & Policies",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-beevo-border bg-[#FFFEFB]">
      <div className="beevo-container py-12 md:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand Summary */}
          <div className="md:col-span-4 lg:col-span-5">
            <Link
              href="/"
              aria-label="Beevo — Home"
              className="inline-flex min-h-[44px] items-center rounded-md pr-2"
            >
              <BeevoLogo variant="horizontal" iconSize={25} />
            </Link>
            <p className="mt-2.5 max-w-[330px] text-[14px] leading-[1.65] text-beevo-muted">
              AI-powered illustrated cartoon storytelling and explainer video creation. Turn your
              ideas or scripts into synced scenes, natural voiceover, and ready-to-download MP4
              videos with simple one-time credit packs.
            </p>
            <p className="mt-4 text-[12.5px] font-semibold text-beevo-muted">
              100 credits = 1 minute &middot; One-time packs &middot; No subscription
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 lg:col-span-7">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading}>
                <h2 className="font-display text-[13px] font-bold tracking-[0.01em] text-beevo-ink">
                  {col.heading}
                </h2>
                <ul className="mt-2 space-y-0.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center text-[13.5px] font-medium text-beevo-muted transition-colors hover:text-beevo-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Legal Line */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-beevo-border/80 pt-6 text-[12.5px] text-beevo-muted sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} Beevo. All rights reserved.</p>
          <p>
            Composed animated cartoon storytelling built with AI illustrations, natural voiceover,
            and motion graphics.
          </p>
        </div>
      </div>
    </footer>
  );
}
