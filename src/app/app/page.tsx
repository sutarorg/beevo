import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Coins,
  Film,
  Layers,
  ReceiptText,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getDashboardSnapshot } from "@/lib/app-api";
import { PRICING_PACKS } from "@/lib/beevo-data";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Studio Dashboard",
  description: "Manage your Beevo cartoon video projects, credit wallet, and recent generations.",
  path: "/app",
  noIndex: true,
});

export default function DashboardPage() {
  const snapshot = getDashboardSnapshot();
  const { wallet, recentProjects, activeGeneration, recentTransactions } = snapshot.data;

  return (
    <div className="space-y-6 pb-4">
      {/* Studio Greeting Hero */}
      <section className="relative overflow-hidden rounded-[24px] border border-beevo-border-warm bg-gradient-to-br from-[#FFFDF7] via-[#FFF9E9]/85 to-[#FFF4CE]/65 p-5 shadow-beevo-card sm:p-7 lg:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <Eyebrow showSparkle>Beevo Creative Studio</Eyebrow>
            <h1 className="mt-3 font-display text-[clamp(1.6rem,3.2vw,2.35rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-beevo-ink">
              Welcome back. What are we creating today?
            </h1>
            <p className="mt-2.5 max-w-xl text-[14.5px] leading-relaxed text-beevo-body">
              Write a fresh story idea, review every scene in your dynamic storyboard, and render
              illustrated cartoon videos with consistent characters and natural voiceover.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/app/create"
                className="beevo-btn-primary min-h-[48px] px-6 text-[14.5px]"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Create Video
              </Link>
              <Link
                href="/app/credits"
                className="beevo-btn-secondary min-h-[48px] px-5 text-[14px]"
              >
                <Coins className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                Buy Credits
              </Link>
            </div>
          </div>

          {/* Credit Wallet Card */}
          <div className="w-full rounded-[20px] border border-beevo-border bg-white/95 p-5 shadow-sm lg:w-[320px] lg:shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-beevo-honey-text">
                <Coins className="h-4 w-4" aria-hidden="true" />
                Credit Wallet
              </span>
              <span className="rounded-full bg-beevo-cream px-2.5 py-0.5 text-[11px] font-bold text-beevo-ink">
                100 cr / min
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <p className="font-display text-[32px] font-extrabold leading-none tabular-nums text-beevo-ink">
                {wallet ? wallet.availableCredits.toLocaleString() : "—"}
              </p>
              <span className="text-[13px] font-semibold text-beevo-muted">credits available</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-beevo-border/80 pt-3 text-[12.5px]">
              <span className="text-beevo-muted">Reserved in active jobs</span>
              <span className="font-bold tabular-nums text-beevo-ink">
                {wallet ? `${wallet.reservedCredits.toLocaleString()} cr` : "—"}
              </span>
            </div>

            <p className="mt-2.5 text-[12px] leading-relaxed text-beevo-muted">
              {snapshot.connectionState === "connected"
                ? "Failed renders are automatically refunded."
                : "Sign in to load your live Supabase wallet balance (connects in Phase 4)."}
            </p>

            <Link
              href="/app/credits"
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-beevo-dark px-4 text-[13px] font-bold text-[#FFFDF7] transition-colors hover:bg-[#2F2B25]"
            >
              View Credit Packs
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Dashboard 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Primary Column: Recent Projects + Active Generation */}
        <div className="space-y-6 lg:col-span-8">
          {/* Recent Projects */}
          <section
            aria-labelledby="recent-projects-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="recent-projects-heading"
                  className="font-display text-[19px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                >
                  Recent Projects
                </h2>
                <p className="mt-0.5 text-[13px] text-beevo-muted">
                  Your storyboards, drafts, and completed animated stories.
                </p>
              </div>
              <Link
                href="/app/videos"
                className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-bold text-beevo-ink hover:text-beevo-honey-text"
              >
                All Videos
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="mt-5 flex flex-col items-center rounded-[18px] border border-dashed border-beevo-border-warm bg-beevo-cream/45 px-5 py-9 text-center sm:px-8 sm:py-11">
                <Image
                  src="/images/beevo/bee-flight-doodle.webp"
                  alt="Beevo creative studio mascot"
                  width={260}
                  height={210}
                  className="h-auto w-[112px] object-contain"
                />
                <h3 className="mt-4 font-display text-[20px] font-extrabold tracking-[-0.02em] text-beevo-ink">
                  Every great story starts with an idea.
                </h3>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-beevo-body">
                  You don&apos;t have any projects yet. Describe your concept in the Creation
                  Studio to plan scenes, pick an art style, and narrate your first cartoon video.
                </p>
                <Link
                  href="/app/create"
                  className="beevo-btn-primary mt-6 min-h-[46px] px-6 text-[14px]"
                >
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                  Create Your First Video
                </Link>
              </div>
            ) : null}
          </section>

          {/* Active / Recent Generation Status */}
          <section
            aria-labelledby="generation-status-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="generation-status-heading"
                    className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-beevo-ink"
                  >
                    Generation Status
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Real-time 10-stage render progress appears here while a video builds.
                  </p>
                </div>
              </div>
            </div>

            {activeGeneration === null ? (
              <div className="mt-4 rounded-[16px] border border-beevo-border bg-beevo-canvas p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[14px] font-bold text-beevo-ink">
                      No active generations running
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-beevo-muted">
                      Once you approve a storyboard, you can watch every image, voiceover track,
                      timeline cut, and FFmpeg render step live.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/app/projects/new/storyboard"
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-beevo-border bg-white px-4 text-[12.5px] font-bold text-beevo-ink hover:bg-beevo-cream"
                    >
                      <Layers className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                      Storyboard Workspace
                    </Link>
                    <Link
                      href="/app/generations/status"
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-beevo-border bg-white px-4 text-[12.5px] font-bold text-beevo-ink hover:bg-beevo-cream"
                    >
                      <Film className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
                      Generation Monitor
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* Right Secondary Column: Recent Credit Activity + Quick Buy Credits */}
        <div className="space-y-6 lg:col-span-4">
          {/* Recent Credit Activity */}
          <section
            aria-labelledby="credit-activity-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="credit-activity-heading"
                className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-beevo-ink"
              >
                Recent Credit Activity
              </h2>
              <Link
                href="/app/transactions"
                className="inline-flex min-h-[44px] items-center text-[12.5px] font-bold text-beevo-honey-text hover:underline"
              >
                Ledger
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="mt-3 rounded-[16px] border border-beevo-border bg-beevo-canvas p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-beevo-cream text-beevo-honey-text">
                  <ReceiptText className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-3 text-[14px] font-bold text-beevo-ink">
                  No credit transactions yet
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-beevo-muted">
                  Pack purchases, render reservations, deductions, and automatic refunds will be
                  recorded here once your account is active.
                </p>
              </div>
            ) : null}
          </section>

          {/* Buy Credits Quick Shortcut */}
          <section
            aria-labelledby="quick-packs-heading"
            className="rounded-[22px] border border-[#2F2B25] bg-beevo-dark p-5 text-[#FFFDF7] shadow-beevo sm:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-[#FFC928]">
                <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                One-Time Credit Packs
              </span>
              <span className="text-[11.5px] font-semibold text-[#D6D0C4]">No subscription</span>
            </div>

            <h2
              id="quick-packs-heading"
              className="mt-2 font-display text-[19px] font-extrabold leading-snug tracking-[-0.02em] text-[#FFFDF7]"
            >
              Top up only when you create
            </h2>

            <div className="mt-4 space-y-2.5">
              {PRICING_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`flex items-center justify-between gap-2 rounded-[14px] border px-3.5 py-2.5 ${
                    pack.popular
                      ? "border-[#FFC928]/80 bg-[#2A2621]"
                      : "border-[#38332C] bg-[#23201C]"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[13.5px] font-extrabold text-[#FFFDF7]">
                        {pack.name}
                      </span>
                      {pack.popular && (
                        <span className="rounded-full bg-[#FFC928] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-beevo-ink">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#C8C2B6]">
                      {pack.creditsLabel} &middot; {pack.capacityLabel}
                    </p>
                  </div>
                  <span className="font-display text-[16px] font-extrabold tabular-nums text-[#FFFDF7]">
                    {pack.priceDisplay}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/app/credits"
              className="beevo-btn-primary mt-5 min-h-[46px] w-full text-[13.5px]"
            >
              Buy Credits
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
