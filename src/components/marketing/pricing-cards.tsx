"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { PLANS } from "@/lib/constants";
import { Button, Segmented } from "@/components/ui/primitives";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("monthly");

  const priceFor = (monthly: number) => {
    if (monthly === 0) return { main: formatINR(0), note: "forever free" };
    return cycle === "monthly"
      ? { main: formatINR(monthly), note: "per month + GST" }
      : { main: formatINR(666), note: "per month · billed ₹7,990/yr" };
  };

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <Segmented
          id="billing-cycle"
          value={cycle}
          onChange={setCycle}
          options={[
            { value: "monthly", label: "Monthly" },
            {
              value: "annual",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  Annual
                  <span className="rounded-full bg-honey-100 px-1.5 py-px text-[10px] font-bold text-honey-700">
                    2 months free
                  </span>
                </span>
              ),
            },
          ]}
        />
      </div>

      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        {PLANS.map((p, i) => {
          const pro = p.id === "pro";
          const price = priceFor(p.priceInr);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7 sm:p-8",
                pro
                  ? "border-honey-500/70 bg-ink-950 text-cream-50 shadow-[var(--shadow-lift)] comb-dark"
                  : "border-cream-300 bg-white/85 shadow-[var(--shadow-card)] comb-light"
              )}
            >
              {pro && (
                <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-honey-400 to-honey-600 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-950 shadow-[var(--shadow-gold)]">
                  <Sparkles size={11} /> Most popular
                </span>
              )}
              <div className="flex items-center gap-2">
                <p className={cn("text-lg font-semibold tracking-tight", pro ? "text-cream-50" : "text-ink-950")}>
                  {p.name}
                </p>
                {pro && <Crown size={16} className="text-honey-400" />}
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className={cn("tnum text-5xl font-bold tracking-tight", pro ? "text-honey-300" : "text-ink-950")}>
                  {price.main}
                </span>
              </div>
              <p className={cn("mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em]", pro ? "text-cream-50/50" : "text-ink-600/55")}>
                {price.note}
              </p>
              <p className={cn("mt-3 text-sm leading-relaxed", pro ? "text-cream-50/65" : "text-ink-600/80")}>{p.blurb}</p>

              <ul className={cn("mt-6 flex-1 space-y-2.5", compact && "space-y-2")}>
                {p.features.map((f) => (
                  <li
                    key={f.label}
                    className={cn(
                      "flex items-center gap-2.5 text-[13.5px]",
                      f.included
                        ? pro
                          ? "text-cream-50/90"
                          : "text-ink-800"
                        : cn("line-through", pro ? "text-cream-50/30 decoration-cream-50/20" : "text-ink-600/40 decoration-cream-300")
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        f.included ? (pro ? "bg-honey-500/25 text-honey-300" : "bg-lime-100 text-leaf-600") : pro ? "bg-white/5 text-cream-50/25" : "bg-cream-200/70 text-ink-600/30"
                      )}
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>

              <Link href={pro ? "/signup?plan=pro" : "/signup"} className="mt-7 block">
                <Button size="lg" className="w-full" variant={pro ? "primary" : "dark"}>
                  {p.cta}
                  {pro && <Sparkles size={15} />}
                </Button>
              </Link>
              {pro && (
                <p className="mt-3 text-center text-[11px] text-cream-50/45">
                  14-day money-back promise · GST invoice on email
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
