import { ArrowRight } from "lucide-react";
import Link from "next/link";

export interface RelatedLink {
  href: string;
  label: string;
  description: string;
}

/**
 * "Keep exploring" band used at the bottom of interior marketing pages.
 *
 * Public pages stayed almost link-isolated before (header/footer only). These
 * contextual links give readers — and crawlers — a clear path between the
 * pages that answer related questions (features → pricing → how it works →
 * FAQ → refund policy).
 */
export function RelatedLinks({
  title = "Keep exploring",
  links,
}: {
  title?: string;
  links: RelatedLink[];
}) {
  if (links.length === 0) return null;
  return (
    <section
      aria-labelledby="related-links-heading"
      className="border-t-2 border-ink bg-parchment"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <h2
          id="related-links-heading"
          className="text-xs font-bold tracking-[0.22em] text-accent-deep uppercase"
        >
          {title}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <li key={link.href} className="min-w-0">
              <Link
                href={link.href}
                className="group flex h-full flex-col rounded-2xl border-2 border-ink bg-white p-5 shadow-hard-xs transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="flex items-center justify-between gap-3 text-base font-bold text-ink">
                  {link.label}
                  <ArrowRight
                    className="size-4 shrink-0 text-accent-deep transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-smoke">
                  {link.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
