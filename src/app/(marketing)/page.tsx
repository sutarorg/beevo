"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Wand2,
  Clock3,
  BarChart3,
  Share2,
  Images,
  Check,
  Plus,
  Hexagon,
  ChevronDown,
  Star,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import { PLATFORMS } from "@/lib/constants";
import { Button, Badge, HexAvatar } from "@/components/ui/primitives";
import { BeeMark, HexCell } from "@/components/brand/bee-mark";
import { PlatformIcon, PlatformChip } from "@/components/brand/platform-icon";
import { HeroBoard } from "@/components/marketing/hero-board";
import { PricingCards } from "@/components/marketing/pricing-cards";
import type { HTMLMotionProps } from "framer-motion";

const reveal = (delay = 0): HTMLMotionProps<"div"> => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function LandingPage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 comb-light">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(640px 380px at 18% 8%, rgba(245,163,1,0.16), transparent 60%), radial-gradient(520px 320px at 88% 30%, rgba(245,163,1,0.12), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div {...reveal(0)}>
              <Badge tone="gold" className="!px-3 !py-1.5 !text-xs">
                <Sparkles size={12} /> New — Hive Writer, your AI caption bee
              </Badge>
            </motion.div>
            <motion.h1
              {...reveal(0.08)}
              className="mt-5 text-[44px] font-semibold leading-[1.02] tracking-tight text-ink-950 sm:text-6xl lg:text-[68px] text-balance"
            >
              Plan once.
              <br />
              <span className="font-display italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-honey-600 via-honey-500 to-honey-700">
                Buzz everywhere.
              </span>
            </motion.h1>
            <motion.p {...reveal(0.16)} className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-600">
              Beevo is the social media planner that keeps your whole hive in order — craft one
              post and schedule it to Instagram, Facebook, X, LinkedIn, Pinterest and YouTube.
              Free forever, Pro at just ₹799/month.
            </motion.p>
            <motion.div {...reveal(0.24)} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Start free — no card needed <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  See pricing
                </Button>
              </Link>
            </motion.div>
            <motion.div {...reveal(0.32)} className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["Free plan forever", "Pro ₹799/mo + GST", "Cancel anytime"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-700">
                  <Check size={14} className="text-leaf-600" /> {t}
                </span>
              ))}
            </motion.div>
            <motion.div {...reveal(0.4)} className="mt-8 flex items-center gap-3">
              <span className="flex -space-x-1.5">
                {PLATFORMS.map((p) => (
                  <PlatformChip key={p.id} platform={p.id} size={30} className="ring-2 ring-cream-100" />
                ))}
              </span>
              <p className="text-[12.5px] text-ink-600/75">
                One calendar. <span className="font-semibold text-ink-900">Six channels.</span>
              </p>
            </motion.div>
          </div>
          <HeroBoard />
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <section className="overflow-hidden border-y border-cream-300/80 bg-cream-50 py-5">
        <div className="flex w-max animate-marquee gap-12">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-12" aria-hidden={dup === 1}>
              {PLATFORMS.map((p) => (
                <span key={p.id} className="flex items-center gap-2.5 text-ink-600/60">
                  <PlatformIcon platform={p.id} size={18} colored />
                  <span className="text-sm font-semibold tracking-wide">{p.name}</span>
                </span>
              ))}
              {["12,000+ creators", "3.1M posts scheduled", "99.98% publish rate", "4.9 / 5 on Product Hunt"].map((s) => (
                <span key={s} className="flex items-center gap-2.5 text-ink-600/60">
                  <Hexagon size={14} className="text-honey-500" />
                  <span className="text-sm font-semibold tracking-wide">{s}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES BENTO ================= */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
        <motion.div {...reveal()} className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-700">Everything in one comb</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl text-balance">
            Built like a hive.{" "}
            <span className="font-display italic font-medium text-honey-600">Runs like clockwork.</span>
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-600">
            Six tools that usually live in six tabs — fused into one calm, golden workspace.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {/* calendar — big */}
          <motion.div {...reveal(0)} className="md:col-span-2">
            <BentoShell>
              <BentoText
                icon={CalendarDays}
                title="A visual calendar you'll actually enjoy"
                body="Drag posts between days, colour-code by status, and spot empty cells in your week at a glance. Rescheduling is one drag — not twelve clicks."
              />
              <MiniCalendar />
            </BentoShell>
          </motion.div>

          {/* ai */}
          <motion.div {...reveal(0.08)}>
            <BentoShell gold>
              <BentoText
                icon={Wand2}
                title="Hive Writer AI"
                body="Three on-brand captions per brief. Pick a tone, click to apply, ship it."
                pro
              />
              <div className="mt-5 space-y-2">
                <div className="rounded-xl border border-honey-500/40 bg-ink-950/70 p-3 text-[11.5px] leading-relaxed text-cream-50/85">
                  “Golden hour hits different when the jar is still warm…”
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[11.5px] leading-relaxed text-cream-50/45 blur-[2px]">
                  “POV: it's 7:04 am and the toast is perfect…”
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-widest text-honey-400">
                  <Sparkles size={10} /> tone: playful
                </span>
              </div>
            </BentoShell>
          </motion.div>

          {/* best time */}
          <motion.div {...reveal(0.05)}>
            <BentoShell>
              <BentoText
                icon={Clock3}
                title="Best-time engine"
                body="Every audience has a honey hour. We find yours and pre-fill it."
                pro
              />
              <MiniHeatmap />
            </BentoShell>
          </motion.div>

          {/* analytics */}
          <motion.div {...reveal(0.1)}>
            <BentoShell>
              <BentoText icon={BarChart3} title="Analytics that read like a story" body="Reach, engagement and follower momentum per channel — with deltas, not just charts." />
              <MiniChart />
            </BentoShell>
          </motion.div>

          {/* multi-channel */}
          <motion.div {...reveal(0.15)}>
            <BentoShell>
              <BentoText icon={Share2} title="Write once, tailor per channel" body="X gets 280 characters, LinkedIn gets nuance. Beevo counts characters per platform so nothing gets cut." />
              <div className="mt-5 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-2.5 py-1.5 font-mono text-[10px] text-ink-600/75">
                    <PlatformIcon platform={p.id} size={11} colored />
                    {formatCompact(p.charLimit)}
                  </span>
                ))}
              </div>
            </BentoShell>
          </motion.div>

          {/* media */}
          <motion.div {...reveal(0.2)} className="md:col-span-3 lg:col-span-1">
            <BentoShell>
              <BentoText icon={Images} title="A media library with memory" body="Every asset knows where it's been. Reuse winners without re-uploading." />
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["/media/honey-jar.jpg", "/media/cafe-pour.jpg", "/media/flatlay-skincare.jpg", "/media/sunset-run.jpg", "/media/workshop.jpg", "/media/team-desk.jpg"].map((src) => (
                  <span key={src} className="aspect-square overflow-hidden rounded-lg border border-cream-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                  </span>
                ))}
              </div>
            </BentoShell>
          </motion.div>
        </div>
      </section>

      {/* ================= PLATFORMS CLUSTER ================= */}
      <section id="platforms" className="relative scroll-mt-24 overflow-hidden border-y border-ink-800 bg-ink-950 py-24 text-cream-50 comb-dark">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(600px 400px at 50% 100%, rgba(245,163,1,0.14), transparent 62%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <motion.div {...reveal()}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-400">Six hives, one queen</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
              Every channel your
              <span className="font-display italic font-medium text-honey-300"> audience swarms to.</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cream-50/60">
              Connect once with secure OAuth. Beevo formats, counts and publishes natively to each
              platform — reels, threads, pins, shorts and all.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Native formats: reels, carousels, threads, pins, shorts",
                "Per-platform character counting & previews",
                "Token health monitoring with auto-reconnect nudges",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm text-cream-50/80">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-honey-500/20 text-honey-400">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8 inline-block">
              <Button size="lg">Connect your first channel <ArrowRight size={15} /></Button>
            </Link>
          </motion.div>

          {/* hex cluster */}
          <motion.div {...reveal(0.12)} className="relative mx-auto aspect-square w-full max-w-[440px]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const pts = [
                  [50, 13], [82.4, 31.5], [82.4, 68.5], [50, 87], [17.6, 68.5], [17.6, 31.5],
                ][i];
                return (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={pts[0]}
                    y2={pts[1]}
                    stroke="#F5A301"
                    strokeOpacity="0.25"
                    strokeWidth="0.4"
                    strokeDasharray="1.5 2"
                  />
                );
              })}
              <circle cx="50" cy="50" r="30" fill="none" stroke="#F5A301" strokeOpacity="0.16" strokeWidth="0.4" />
            </svg>
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <BeeMark size={92} id="cluster" />
            </motion.div>
            {PLATFORMS.map((p, i) => {
              const pos = [
                { left: "50%", top: "4%" },
                { left: "86%", top: "27%" },
                { left: "86%", top: "65%" },
                { left: "50%", top: "83%" },
                { left: "11%", top: "65%" },
                { left: "11%", top: "27%" },
              ][i];
              return (
                <motion.div
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={pos}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.12 }}
                >
                  <div className="hex-clip flex h-16 w-[60px] flex-col items-center justify-center gap-0.5 border border-honey-500/30 bg-ink-800/90 backdrop-blur sm:h-[76px] sm:w-[70px]"
                    style={{ boxShadow: `0 10px 30px -10px ${p.color}55` }}
                  >
                    <PlatformIcon platform={p.id} size={20} colored />
                    <span className="mt-0.5 text-[7.5px] font-semibold uppercase tracking-wider text-cream-50/50">
                      {p.name.split(" ")[0]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <motion.div {...reveal()} className="mx-auto max-w-xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-700">Three flights to done</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink-950 text-balance">
            From blank page to <span className="font-display italic font-medium text-honey-600">everywhere</span> in minutes
          </h2>
        </motion.div>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          {[
            { n: "01", t: "Connect your hives", d: "Link Instagram, Facebook, X, LinkedIn, Pinterest and YouTube with secure OAuth in under two minutes." },
            { n: "02", t: "Compose once, tailor fast", d: "Write one caption. Hive Writer offers alternates; Beevo counts characters per channel automatically." },
            { n: "03", t: "Schedule at honey hour", d: "Drop posts onto the visual calendar. The best-time engine fills peak slots so every post lands." },
          ].map((s, i) => (
            <motion.div key={s.n} {...reveal(i * 0.08)} className="relative">
              <div className="flex items-center gap-3">
                <span className="hex-clip flex h-14 w-12 items-center justify-center bg-gradient-to-b from-honey-300 to-honey-500 font-mono text-sm font-bold text-ink-950 shadow-[var(--shadow-gold)]">
                  {s.n}
                </span>
                {i < 2 && <span className="hidden h-px flex-1 border-t-2 border-dashed border-honey-400/50 md:block" />}
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink-950">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="scroll-mt-24 border-t border-cream-300/70 bg-cream-50/60 py-24 comb-light">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...reveal()} className="mx-auto max-w-xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-700">Pricing in ₹ INR</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink-950 text-balance">
              Honest as honey. <span className="font-display italic font-medium text-honey-600">Free to start.</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
              Start on ₹0 forever. Move to Pro at ₹799/month when the hive outgrows the jar —
              GST invoice included, cancel anytime.
            </p>
          </motion.div>
          <div className="mt-12">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section id="testimonials" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
        <motion.div {...reveal()} className="mx-auto max-w-xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-700">Word from the swarm</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink-950 text-balance">
            Loved by <span className="font-display italic font-medium text-honey-600">12,000+</span> busy bees
          </h2>
        </motion.div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { name: "Ritika Sharma", role: "Founder, Clay & Co.", hue: 350, quote: "We went from three chaotic tabs to one calm calendar. Our Sunday reel cadence hasn't missed once in 8 months — engagement is up 41%.", stars: 5 },
            { name: "Aditya Rao", role: "Social lead, Brew Stories", hue: 210, quote: "The best-time engine is stupidly good. Same content, same budget, double the reach. Pro paid for itself in the first week.", stars: 5 },
            { name: "Meera Iyer", role: "Creator, 320k on IG", hue: 130, quote: "Hive Writer sounds like me on my best day. I batch a fortnight of posts in one sitting and Beevo handles the rest.", stars: 5 },
          ].map((t, i) => (
            <motion.figure key={t.name} {...reveal(i * 0.08)} className="relative flex flex-col rounded-3xl border border-cream-300 bg-white/85 p-6 shadow-[var(--shadow-card)]">
              <span className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center hex-clip bg-gradient-to-b from-honey-400 to-honey-600 font-display text-lg italic text-ink-950">”</span>
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} size={13} className="fill-honey-500 text-honey-500" />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-[14px] leading-relaxed text-ink-800">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-cream-200 pt-4">
                <HexAvatar name={t.name} hue={t.hue} size={38} />
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-950">{t.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-600/55">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="scroll-mt-24 border-t border-cream-300/70 bg-cream-50/60 py-24 comb-light">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div {...reveal()} className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-700">FAQ</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink-950 text-balance">
              Sticky questions, <span className="font-display italic font-medium text-honey-600">sweet answers</span>
            </h2>
          </motion.div>
          <div className="mt-12 space-y-3">
            <Faq />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative overflow-hidden bg-ink-950 py-24 text-center text-cream-50 comb-dark">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(600px 300px at 50% 0%, rgba(245,163,1,0.2), transparent 62%)" }}
        />
        <motion.div {...reveal()} className="relative mx-auto max-w-2xl px-4">
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="mx-auto w-fit"
          >
            <BeeMark size={72} id="cta" />
          </motion.div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl text-balance">
            Your best posting streak
            <span className="font-display italic font-medium text-honey-300"> starts today.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-cream-50/60">
            Free forever for 10 posts a month. When you're ready, Pro is ₹799/month —
            less than one boosted post.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start free <Zap size={15} /></Button>
            </Link>
          </div>
        </motion.div>
        <HexCell size={220} className="absolute -left-16 -bottom-20 opacity-60" stroke="#F5A301" opacity={0.12} />
        <HexCell size={160} className="absolute -right-10 -top-14 opacity-60" stroke="#F5A301" opacity={0.1} />
      </section>
    </>
  );
}

/* ---------------- bento helpers ---------------- */
function BentoShell({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div
      className={cn(
        "h-full overflow-hidden rounded-3xl border p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-lift)] sm:p-7",
        gold ? "border-honey-500/40 bg-ink-950 text-cream-50 comb-dark" : "border-cream-300 bg-white/85 shadow-[var(--shadow-card)]"
      )}
    >
      {children}
    </div>
  );
}

function BentoText({
  icon: Icon,
  title,
  body,
  pro,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  pro?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey-100 text-honey-700 border border-honey-300/60">
          <Icon size={16} />
        </span>
        <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        {pro && (
          <span className="rounded-full bg-gradient-to-r from-honey-400 to-honey-600 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-ink-950">
            Pro
          </span>
        )}
      </div>
      <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed opacity-75">{body}</p>
    </div>
  );
}

function MiniCalendar() {
  const dots = [2, 4, 6, 9, 11, 12, 15, 18, 20, 23, 25, 27];
  return (
    <div className="mt-6 grid max-w-md grid-cols-7 gap-1.5">
      {Array.from({ length: 28 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "flex aspect-[4/3] items-center justify-center rounded-lg border text-[9px] font-mono",
            dots.includes(i)
              ? "border-honey-500/60 bg-honey-100 text-honey-800"
              : "border-cream-200 bg-cream-50 text-ink-600/40"
          )}
        >
          {dots.includes(i) ? <PlatformChip platform={PLATFORMS[i % 6].id} size={15} /> : i + 1}
        </div>
      ))}
      <span className="col-span-7 mt-1 inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-widest text-ink-600/50">
        <Plus size={10} className="text-honey-600" /> drag anywhere to reschedule
      </span>
    </div>
  );
}

function MiniHeatmap() {
  const cells = [10, 22, 35, 18, 46, 88, 30, 14, 26, 40, 22, 55, 92, 34, 12, 20, 30, 16, 42, 78, 28];
  return (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {cells.map((v, i) => (
        <span
          key={i}
          className="hex-clip h-8 w-8"
          style={{ background: `rgba(245,163,1,${0.08 + (v / 100) * 0.9})` }}
          title={`score ${v}`}
        />
      ))}
    </div>
  );
}

function MiniChart() {
  const pts = [30, 44, 38, 56, 48, 66, 58, 78, 70, 88, 82, 96];
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i * 100) / (pts.length - 1)},${100 - p}`).join(" ");
  return (
    <div className="mt-5">
      <svg viewBox="0 0 100 100" className="h-28 w-full" preserveAspectRatio="none">
        <path d={`${path} L100,100 L0,100 Z`} fill="rgba(245,163,1,0.18)" />
        <path d={path} fill="none" stroke="#D98206" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest text-ink-600/50">
        <span>Mar</span><span>Apr</span><span>May</span>
      </div>
    </div>
  );
}

/* ---------------- FAQ accordion ---------------- */
const FAQS = [
  { q: "Is the Free plan really free forever?", a: "Yes — ₹0, no card required. You get 10 scheduled posts every month, 2 connected accounts, the visual calendar and basic analytics. It resets on the 1st of each month, forever." },
  { q: "What does Pro at ₹799/month add?", a: "Unlimited posts, up to 12 connected accounts, the Hive Writer AI caption assistant, the best-time-to-post engine, bulk scheduling via CSV, 12-month analytics with exports, and 3 team seats. Billed in INR with an 18% GST invoice." },
  { q: "Can I pay with UPI?", a: "Absolutely. UPI, credit/debit cards and net banking are all supported at checkout, and you can enable UPI autopay so renewals never interrupt your streak." },
  { q: "Which platforms can I schedule to?", a: "Instagram, Facebook, Twitter/X, LinkedIn, Pinterest and YouTube — including reels, carousels, threads, pins and shorts. Beevo formats each post natively per platform." },
  { q: "What happens if a post fails to publish?", a: "You get an instant alert in-app and by email with the exact reason (usually an expired token). One click retries it once you reconnect the account." },
  { q: "Can I cancel Pro anytime?", a: "Anytime, in two clicks, from Billing. You keep Pro until the end of the paid cycle and then glide back to Free — your posts and history stay intact." },
];

function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <>
      {FAQS.map((f, i) => (
        <div key={f.q} className="overflow-hidden rounded-2xl border border-cream-300 bg-white/85 shadow-[var(--shadow-card)]">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
          >
            <Hexagon size={14} className={cn("shrink-0 transition-colors", open === i ? "fill-honey-400 text-honey-600" : "text-honey-400")} />
            <span className="flex-1 text-[14.5px] font-semibold text-ink-950">{f.q}</span>
            <ChevronDown size={16} className={cn("shrink-0 text-ink-600/50 transition-transform duration-200", open === i && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24 }}
              >
                <p className="px-5 pb-4 pl-12 text-[13.5px] leading-relaxed text-ink-600">{f.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
}
