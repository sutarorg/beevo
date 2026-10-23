import { Info } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_LAST_UPDATED, type LegalSection } from "@/lib/legal";
import { Sticker } from "@/components/ui/primitives";

/**
 * Shared renderer for all legal pages. Copy lives in @/lib/legal so policy
 * updates never require touching page files.
 */
export function LegalPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  children?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <Sticker color="cream">Legal</Sticker>
      <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-smoke">{intro}</p>
      <p className="mt-2 text-xs font-bold tracking-[0.18em] text-smoke uppercase">
        Last updated: {LEGAL_LAST_UPDATED}
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-ink bg-parchment p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-smoke">
          This document is the working policy copy for the Beevo product
          launch. It is provided for informational purposes and does not
          constitute legal advice. If anything here conflicts with a right you
          hold under applicable law, the law prevails.
        </p>
      </div>

      <nav aria-label="On this page" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                href={`#${section.id}`}
                className="inline-block rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-cream"
              >
                {section.heading}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {children}

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 border-t-2 border-ink/10 pt-8"
          >
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {section.heading}
            </h2>
            {section.paragraphs
              .filter((paragraph) => paragraph.length > 0)
              .map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-4 text-sm leading-relaxed text-smoke sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            {section.bullets ? (
              <ul className="mt-4 space-y-2">
                {section.bullets.map((bullet, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm leading-relaxed text-smoke sm:text-base"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
