import { ArrowRight, Asterisk, BadgePercent, Check } from "lucide-react";
import type { ReactNode } from "react";
import { FREE_PLAN, formatINR, PLATFORM_COMMISSION_LABEL } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

/** Hero header used at the top of interior marketing pages. */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b-2 border-ink",
        className,
      )}
    >
      <Asterisk
        aria-hidden="true"
        className="animate-spin-slow absolute -top-10 right-4 size-40 text-accent/15 sm:right-16 sm:size-56"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <Sticker color="accent">{eyebrow}</Sticker>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {lede ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-smoke sm:text-lg">
            {lede}
          </p>
        ) : null}
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </section>
  );
}

/** Dark closing call-to-action band. */
export function CTASection({
  title = "Your next post could pay rent.",
  body = "Spin up your storefront tonight, publish a course this week, and share the link where your audience already is.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-ink bg-ink px-6 py-14 text-center text-cream shadow-hard-accent sm:px-12 sm:py-20">
        <Asterisk
          aria-hidden="true"
          className="animate-spin-slow absolute top-6 left-6 size-16 text-lime/30"
        />
        <Asterisk
          aria-hidden="true"
          className="animate-spin-slow absolute right-6 bottom-6 size-16 text-accent/40"
        />
        <p className="text-xs font-bold tracking-[0.24em] text-lime uppercase">
          Free forever · 8% only when you sell
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-cream/70 sm:text-lg">
          {body}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/signup" variant="lime" size="lg">
            Start free
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Button href="/how-it-works" variant="outline-cream" size="lg">
            See how it works
          </Button>
        </div>
        <p className="mt-6 text-xs text-cream/50">
          No card required · No minimum audience · No marketplace
        </p>
      </div>
    </section>
  );
}

/** The single Free plan card — reused on the homepage and /pricing. */
export function PlanCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8",
        className,
      )}
    >
      <div className="absolute -top-4 left-6">
        <Sticker color="lime">The only plan</Sticker>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-ink">{FREE_PLAN.name}</h3>
          <p className="mt-1 text-sm text-smoke">{FREE_PLAN.tagline}</p>
        </div>
        <div className="text-right">
          <p className="font-editorial text-6xl leading-none text-ink italic sm:text-7xl">
            {formatINR(FREE_PLAN.monthlyPriceInPaise)}
          </p>
          <p className="mt-1 text-xs font-bold tracking-[0.18em] text-smoke uppercase">
            per month, forever
          </p>
        </div>
      </div>

      <div className="ticket-divider my-6" aria-hidden="true" />

      <ul className="grid gap-3 sm:grid-cols-2">
        {FREE_PLAN.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime">
              <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-ink bg-parchment p-4">
        <BadgePercent className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-sm text-ink">
          <span className="font-bold">
            {PLATFORM_COMMISSION_LABEL} commission
          </span>{" "}
          per successful eligible course sale. That's the only way we earn — no
          subscription, no setup fee, no Pro tier.
        </p>
      </div>

      <Button href="/signup" variant="accent" size="lg" className="mt-6 w-full">
        {FREE_PLAN.ctaLabel}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
      <p className="mt-3 text-center text-xs text-smoke">
        No card required · Cancel nothing · There is nothing to cancel
      </p>
    </div>
  );
}
