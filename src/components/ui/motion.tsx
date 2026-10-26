"use client";

import { Asterisk, Plus } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/lib/content";

/**
 * Fade-and-rise scroll reveal.
 *
 * IntersectionObserver + a CSS transition (see `.reveal` in globals.css) —
 * the same visual result as the previous JS animation library, but with no
 * library in the bundle of every marketing page. Falls back to visible when
 * IntersectionObserver is missing, and a safety timer guarantees content is
 * never stuck invisible.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(element);
    const safety = window.setTimeout(() => setVisible(true), 1600);
    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={
        {
          "--reveal-y": `${y}px`,
          transitionDelay: delay ? `${Math.round(delay * 1000)}ms` : undefined,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

/** Infinite horizontal ticker. */
export function Marquee({
  items,
  tone = "lime",
  className,
}: {
  items: readonly string[];
  tone?: "lime" | "ink" | "accent";
  className?: string;
}) {
  const tones = {
    lime: "bg-lime text-ink border-ink",
    ink: "bg-ink text-cream border-ink",
    accent: "bg-accent-deep text-cream border-ink",
  } as const;

  const strip = (ariaHidden: boolean) => (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex w-max shrink-0 items-center"
    >
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="flex items-center gap-6 pr-6 text-sm font-bold tracking-[0.18em] whitespace-nowrap uppercase sm:text-base"
        >
          {item}
          <Asterisk className="size-5" aria-hidden="true" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "marquee-pause overflow-hidden border-y-2 py-3",
        tones[tone],
        className,
      )}
    >
      <div className="animate-marquee flex w-max">
        {strip(false)}
        {strip(true)}
      </div>
    </div>
  );
}

/** Accessible single-open accordion for FAQs. */
export function Accordion({
  items,
  numbered = false,
  className,
}: {
  items: readonly FaqItem[];
  numbered?: boolean;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("divide-y-2 divide-ink/10", className)}>
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="group flex w-full items-center gap-4 py-5 text-left"
            >
              {numbered ? (
                <span className="shrink-0 font-editorial text-xl text-accent-deep italic">
                  {String(index + 1).padStart(2, "0")}
                </span>
              ) : null}
              <span className="flex-1 text-base font-bold text-ink transition-colors group-hover:text-accent-deep sm:text-lg">
                {item.q}
              </span>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink transition-all duration-300",
                  open ? "rotate-45 bg-accent-deep text-cream" : "bg-transparent",
                )}
              >
                <Plus className="size-4" aria-hidden="true" />
              </span>
            </button>
            <div
              aria-hidden={!open}
              className={cn(
                "grid grid-cols-1 transition-all duration-300 ease-out",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-3xl pr-10 pb-6 text-sm leading-relaxed text-smoke sm:text-base">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
