"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Table of contents for legal pages.
 * Desktop: sticky sidebar with scroll-spy highlighting.
 * Mobile: horizontally scrollable chip row under the hero.
 */
export function LegalToc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = React.useState(items[0]?.id ?? "");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-90px 0px -65% 0px", threshold: 0 }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {/* Mobile: scrollable chips */}
      <nav
        aria-label="On this page"
        className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              active === item.id
                ? "border-honey-500/70 bg-honey-100 text-honey-800"
                : "border-cream-300 bg-white/70 text-ink-600/80"
            )}
          >
            {item.title}
          </a>
        ))}
      </nav>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          <p className="pb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-600/50">
            On this page
          </p>
          <nav aria-label="On this page" className="space-y-0.5 border-l border-cream-300">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "relative -ml-px block border-l-2 py-1.5 pl-4 pr-2 text-[13px] leading-snug transition-colors",
                  active === item.id
                    ? "border-honey-500 font-semibold text-honey-800"
                    : "border-transparent text-ink-600/70 hover:text-ink-900"
                )}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
