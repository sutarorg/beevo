import Link from "next/link";
import { BeeWordmark } from "@/components/brand/bee-mark";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#platforms", label: "Platforms" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard", label: "Live demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#testimonials", label: "Customers" },
      { href: "/#faq", label: "FAQ" },
      { href: "/signup", label: "Start free" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Channels",
    links: [
      { href: "/#platforms", label: "Instagram" },
      { href: "/#platforms", label: "Facebook" },
      { href: "/#platforms", label: "Twitter / X" },
      { href: "/#platforms", label: "LinkedIn" },
      { href: "/#platforms", label: "Pinterest" },
      { href: "/#platforms", label: "YouTube" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-ink-800 bg-ink-950 text-cream-50 comb-dark">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(500px 240px at 50% 0%, rgba(245,163,1,0.12), transparent 65%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <BeeWordmark dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-50/55">
              The social media planner that keeps your whole hive in order — schedule to six
              platforms from one golden calendar.
            </p>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-honey-500/80">
              Made with honey in Bengaluru
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-50/40">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-cream-50/65 transition-colors hover:text-honey-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-6">
          <p className="font-mono text-[11px] text-cream-50/40">© 2026 Beevo Labs Pvt. Ltd. · All rights reserved</p>
          <p className="font-mono text-[11px] text-cream-50/40">
            Free ₹0 · Pro ₹799/mo · GST invoices included
          </p>
        </div>
      </div>
    </footer>
  );
}
