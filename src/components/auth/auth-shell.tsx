"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BeeMark, BeeWordmark, HexCell } from "@/components/brand/bee-mark";
import { HexAvatar } from "@/components/ui/primitives";
import { PlatformChip } from "@/components/brand/platform-icon";
import { PLATFORMS } from "@/lib/constants";

export function AuthShell({
  title,
  subtitle,
  children,
  quote,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  quote?: { text: string; name: string; role: string };
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* form side */}
      <div className="flex flex-col justify-center bg-cream-100 px-5 py-10 sm:px-10 comb-light">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" aria-label="Back to home">
            <BeeWordmark />
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="mt-10 text-3xl font-semibold tracking-tight text-ink-950 text-balance">{title}</h1>
            <p className="mt-2 text-sm text-ink-600/80">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>

      {/* honeycomb side */}
      <div className="relative hidden overflow-hidden bg-ink-950 text-cream-50 comb-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(560px 420px at 80% 10%, rgba(245,163,1,0.18), transparent 60%)" }}
        />
        <HexCell size={180} className="absolute -right-14 -top-16" stroke="#F5A301" opacity={0.14} />
        <HexCell size={120} className="absolute right-24 bottom-32" stroke="#F5A301" opacity={0.1} />

        <div className="relative flex items-center justify-between">
          <BeeMark size={44} id="auth" />
          <div className="flex -space-x-1.5">
            {PLATFORMS.map((p) => (
              <PlatformChip key={p.id} platform={p.id} size={30} className="ring-2 ring-ink-950" />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-balance xl:text-[44px]">
            Every post,
            <br />
            <span className="font-display italic font-medium text-honey-300">right on honey hour.</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cream-50/60">
            Join 12,000+ Indian brands and creators scheduling 3.1 million posts across six
            platforms — from one golden calendar.
          </p>
        </motion.div>

        {quote && (
          <motion.figure
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} className="fill-honey-400 text-honey-400" />
              ))}
            </div>
            <blockquote className="mt-3 text-[14px] leading-relaxed text-cream-50/85">“{quote.text}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <HexAvatar name={quote.name} hue={350} size={34} />
              <div>
                <p className="text-[13px] font-semibold text-cream-50">{quote.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-cream-50/45">{quote.role}</p>
              </div>
            </figcaption>
          </motion.figure>
        )}
      </div>
    </div>
  );
}
