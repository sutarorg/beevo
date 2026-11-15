import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface FinalCtaBandProps {
  heading?: string;
  subcopy?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function FinalCtaBand({
  heading = "Your next story deserves to be seen.",
  subcopy = "Describe an idea or paste your narration script. Beevo plans the storyboard, illustrates consistent scenes, syncs natural voiceover, and delivers a ready-to-share MP4.",
  ctaLabel = "Start Creating with Beevo",
  ctaHref = "/get-started",
}: FinalCtaBandProps) {
  return (
    <section aria-labelledby="final-cta-heading" className="bg-beevo-canvas py-12 md:py-16">
      <div className="beevo-container">
        <div className="relative overflow-hidden rounded-[24px] border border-beevo-border-warm bg-gradient-to-br from-[#FFF9E9] via-[#FFF8E4] to-[#FFF2CF] px-6 py-10 shadow-beevo sm:px-10 md:px-12 md:py-12">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="text-center md:col-span-8 md:text-left">
              <h2
                id="final-cta-heading"
                className="font-display text-[clamp(1.75rem,3vw,2.4rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink"
              >
                {heading}
              </h2>
              <p className="mx-auto mt-3.5 max-w-xl text-[15px] leading-[1.65] text-beevo-body md:mx-0">
                {subcopy}
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
                <Link
                  href={ctaHref}
                  className="beevo-btn-primary min-h-[48px] w-full px-7 text-[14.5px] sm:w-auto"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/pricing"
                  className="beevo-btn-secondary min-h-[48px] w-full px-6 text-[14px] sm:w-auto"
                >
                  Compare Credit Packs
                </Link>
              </div>
            </div>

            <div className="flex justify-center md:col-span-4 md:justify-end">
              <Image
                src="/images/beevo/final-cta-beevo.webp"
                alt="Cheerful 3D Beevo mascot celebrating beside a glowing honey star"
                width={260}
                height={240}
                className="h-auto w-[175px] object-contain sm:w-[205px] md:w-[225px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
