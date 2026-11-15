"use client";

import React, { useState } from "react";
import {
  Coins,
  Cpu,
  CreditCard,
  Lock,
  Palette,
  Save,
  ShieldCheck,
} from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminStatusGuard } from "@/components/admin/AdminStatusGuard";
import type {
  AdminApiError,
  AdminApiState,
  AdminConfigurationState,
} from "@/lib/admin-types";

interface ConfigurationClientProps {
  apiState: AdminApiState;
  apiError?: AdminApiError;
  initialConfig: AdminConfigurationState;
}

type ConfigTab = "pricing" | "credits" | "generation" | "creative";
type PackKey = "starter" | "creator" | "studio";

export function ConfigurationClient({
  apiState,
  apiError,
  initialConfig,
}: ConfigurationClientProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>("pricing");
  const [config, setConfig] = useState<AdminConfigurationState>(initialConfig);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const tabs: {
    id: ConfigTab;
    label: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }[] = [
    { id: "pricing", label: "Pricing & Packs", icon: CreditCard },
    { id: "credits", label: "Credit Rules", icon: Coins },
    { id: "generation", label: "Generation Settings", icon: Cpu },
    { id: "creative", label: "Creative Presets", icon: Palette },
  ];

  const packCards: { key: PackKey; label: string }[] = [
    { key: "starter", label: "Starter" },
    { key: "creator", label: "Creator" },
    { key: "studio", label: "Studio" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-beevo-border pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em] text-beevo-ink sm:text-[25px]">
            System Configuration
          </h1>
          <p className="mt-1 text-[13.5px] text-beevo-muted">
            Govern supported pricing packs, credit billing rules, generation concurrency limits,
            and creative presets. All mutations require authorization confirmation and audit logs.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-[8px] border border-beevo-border bg-white px-3 py-2 text-[11.5px] font-bold text-beevo-body sm:self-auto">
          <Lock className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
          Secret API keys never exposed in browser
        </span>
      </header>

      <AdminStatusGuard
        state={apiState}
        error={apiError}
        contextLabel="Live server-side configuration persistence"
        compact
      />

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[10px] border border-beevo-border-warm bg-beevo-cream/85 px-4 py-3 text-[13px] font-semibold text-beevo-ink"
        >
          {feedback}
        </div>
      )}

      {/* Explicit Secret Isolation Callout */}
      <div className="flex items-start gap-2.5 rounded-[10px] border border-beevo-border bg-white px-4 py-3 text-[12.5px] text-beevo-body">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden="true" />
        <p>
          <strong>Zero Exposed Secrets:</strong> OpenAI, fal.ai, ElevenLabs, Razorpay, Cloudflare
          R2, and Supabase service-role credentials remain strictly in encrypted server environment
          variables and are intentionally absent from this UI.
        </p>
      </div>

      {/* Distinct Section Tabs */}
      <div
        role="tablist"
        aria-label="System configuration domains"
        className="flex flex-wrap gap-1.5 rounded-[10px] border border-beevo-border bg-white p-1.5"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-[7px] px-3.5 text-[12.5px] font-bold transition-colors ${
                active
                  ? "bg-beevo-dark text-[#FFFDF7]"
                  : "text-beevo-body hover:bg-[#FAF8F3] hover:text-beevo-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden={true} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel 1: Pricing & Credit Packs */}
      {activeTab === "pricing" && (
        <section
          aria-label="Pricing configuration"
          className="rounded-[12px] border border-beevo-border bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beevo-border pb-3">
            <div>
              <h2 className="font-display text-[15.5px] font-extrabold text-beevo-ink">
                Canonical INR Credit Packs &amp; Tax Rate
              </h2>
              <p className="text-[12px] text-beevo-muted">
                Published Beevo credit packs synced across marketing, Studio checkout, and Razorpay
                orders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingSection("Pricing & Credit Packs")}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] bg-[#FFC928] px-3.5 text-[12.5px] font-extrabold text-beevo-ink hover:bg-[#F2B800]"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save Pricing Changes
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {packCards.map(({ key, label }) => {
              const pack = config.pricing[key];
              return (
                <div
                  key={key}
                  className="rounded-[10px] border border-beevo-border bg-[#FAF8F3] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[15px] font-extrabold text-beevo-ink">
                      {label}
                    </span>
                    <span className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
                      {pack.minutes} min
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label
                        htmlFor={`pack-inr-${key}`}
                        className="block text-[11.5px] font-bold text-beevo-muted"
                      >
                        Price (INR ₹)
                      </label>
                      <input
                        id={`pack-inr-${key}`}
                        type="number"
                        min={1}
                        value={pack.priceInr}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setConfig((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              [key]: { ...prev.pricing[key], priceInr: val },
                            },
                          }));
                        }}
                        className="mt-1 min-h-[38px] w-full rounded-[7px] border border-beevo-border bg-white px-2.5 font-mono text-[13px] font-bold text-beevo-ink"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`pack-cr-${key}`}
                        className="block text-[11.5px] font-bold text-beevo-muted"
                      >
                        Credits Granted
                      </label>
                      <input
                        id={`pack-cr-${key}`}
                        type="number"
                        min={25}
                        step={25}
                        value={pack.credits}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setConfig((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              [key]: { ...prev.pricing[key], credits: val },
                            },
                          }));
                        }}
                        className="mt-1 min-h-[38px] w-full rounded-[7px] border border-beevo-border bg-white px-2.5 font-mono text-[13px] font-bold text-beevo-ink"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 max-w-xs">
            <label
              htmlFor="configured-tax-rate"
              className="block text-[12px] font-bold text-beevo-ink"
            >
              Configured Tax Rate (GST %)
            </label>
            <input
              id="configured-tax-rate"
              type="number"
              min={0}
              max={50}
              value={config.pricing.configuredGstRatePct}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  pricing: {
                    ...prev.pricing,
                    configuredGstRatePct: Number(e.target.value) || 0,
                  },
                }))
              }
              className="mt-1 min-h-[40px] w-full rounded-[8px] border border-beevo-border bg-[#FAF8F3] px-3 font-mono text-[13px] font-bold text-beevo-ink"
            />
          </div>
        </section>
      )}

      {/* Panel 2: Credit Rules */}
      {activeTab === "credits" && (
        <section
          aria-label="Credit rules configuration"
          className="rounded-[12px] border border-beevo-border bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beevo-border pb-3">
            <div>
              <h2 className="font-display text-[15.5px] font-extrabold text-beevo-ink">
                Credit Consumption &amp; Reservation Rules
              </h2>
              <p className="text-[12px] text-beevo-muted">
                Canonical Beevo credit metering (100 credits/min · 25 credits/15s · 10 min max).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingSection("Credit Billing Rules")}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] bg-[#FFC928] px-3.5 text-[12.5px] font-extrabold text-beevo-ink hover:bg-[#F2B800]"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save Credit Rules
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <label htmlFor="cr-per-min" className="block text-[11.5px] font-bold text-beevo-muted">
                Credits per minute
              </label>
              <input
                id="cr-per-min"
                type="number"
                value={config.creditRules.creditsPerMinute}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    creditRules: {
                      ...prev.creditRules,
                      creditsPerMinute: Number(e.target.value) || 0,
                    },
                  }))
                }
                className="mt-1.5 min-h-[38px] w-full rounded-[7px] border border-beevo-border bg-white px-2.5 font-mono text-[14px] font-extrabold text-beevo-ink"
              />
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <label htmlFor="cr-per-15s" className="block text-[11.5px] font-bold text-beevo-muted">
                Credits per 15 seconds
              </label>
              <input
                id="cr-per-15s"
                type="number"
                value={config.creditRules.creditsPer15Seconds}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    creditRules: {
                      ...prev.creditRules,
                      creditsPer15Seconds: Number(e.target.value) || 0,
                    },
                  }))
                }
                className="mt-1.5 min-h-[38px] w-full rounded-[7px] border border-beevo-border bg-white px-2.5 font-mono text-[14px] font-extrabold text-beevo-ink"
              />
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <label htmlFor="max-dur-min" className="block text-[11.5px] font-bold text-beevo-muted">
                Max video duration (minutes)
              </label>
              <input
                id="max-dur-min"
                type="number"
                value={config.creditRules.maxVideoMinutes}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    creditRules: {
                      ...prev.creditRules,
                      maxVideoMinutes: Number(e.target.value) || 0,
                    },
                  }))
                }
                className="mt-1.5 min-h-[38px] w-full rounded-[7px] border border-beevo-border bg-white px-2.5 font-mono text-[14px] font-extrabold text-beevo-ink"
              />
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <p className="text-[11.5px] font-bold text-beevo-muted">Failed job policy</p>
              <p className="mt-2 font-display text-[13.5px] font-extrabold text-emerald-800">
                Auto-release 100% of reserved credits
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Panel 3: Generation Settings */}
      {activeTab === "generation" && (
        <section
          aria-label="Generation settings configuration"
          className="rounded-[12px] border border-beevo-border bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beevo-border pb-3">
            <div>
              <h2 className="font-display text-[15.5px] font-extrabold text-beevo-ink">
                Pipeline Models, Output Formats &amp; Concurrency
              </h2>
              <p className="text-[12px] text-beevo-muted">
                Server-supported aspect ratios, resolutions, AI model selectors, retries, and
                worker concurrency caps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingSection("Generation Pipeline Settings")}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] bg-[#FFC928] px-3.5 text-[12.5px] font-extrabold text-beevo-ink hover:bg-[#F2B800]"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save Pipeline Settings
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <p className="text-[11.5px] font-bold text-beevo-muted">Supported Aspect Ratios</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {config.generation.aspectRatios.map((r) => (
                  <span
                    key={r}
                    className="rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 font-mono text-[12px] font-bold text-beevo-ink"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <p className="text-[11.5px] font-bold text-beevo-muted">Output Resolutions</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {config.generation.resolutions.map((res) => (
                  <span
                    key={res}
                    className="rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 font-mono text-[12px] font-bold text-beevo-ink"
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <p className="text-[11.5px] font-bold text-beevo-muted">Supported Languages</p>
              <p className="mt-2 text-[12.5px] font-bold text-beevo-ink">
                {config.generation.supportedLanguages.join(" · ")}
              </p>
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <p className="text-[11.5px] font-bold text-beevo-muted">Image Models (fal.ai)</p>
              <p className="mt-1.5 font-mono text-[12px] font-bold text-beevo-ink">
                {config.generation.imageModels.join(", ")}
              </p>
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <p className="text-[11.5px] font-bold text-beevo-muted">Voice Models (ElevenLabs)</p>
              <p className="mt-1.5 font-mono text-[12px] font-bold text-beevo-ink">
                {config.generation.voiceModels.join(", ")}
              </p>
            </div>

            <div className="rounded-[9px] border border-beevo-border bg-[#FAF8F3] p-3.5">
              <p className="text-[11.5px] font-bold text-beevo-muted">Concurrency &amp; Retries</p>
              <dl className="mt-1.5 space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <dt className="text-beevo-muted">Image concurrency</dt>
                  <dd className="font-mono font-bold text-beevo-ink">
                    {config.generation.imageConcurrency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-beevo-muted">Retry allowance</dt>
                  <dd className="font-mono font-bold text-beevo-ink">
                    {config.generation.retryAllowance}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-beevo-muted">FFmpeg workers</dt>
                  <dd className="font-mono font-bold text-beevo-ink">
                    {config.generation.workerConcurrency}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* Panel 4: Creative Presets */}
      {activeTab === "creative" && (
        <section
          aria-label="Creative presets configuration"
          className="rounded-[12px] border border-beevo-border bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beevo-border pb-3">
            <div>
              <h2 className="font-display text-[15.5px] font-extrabold text-beevo-ink">
                Studio Creative Presets
              </h2>
              <p className="text-[12px] text-beevo-muted">
                Cartoon styles, narration tones, visual pacing, camera movement, transitions,
                captions, and music moods surfaced in /app/create.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingSection("Creative Presets")}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] bg-[#FFC928] px-3.5 text-[12.5px] font-extrabold text-beevo-ink hover:bg-[#F2B800]"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save Preset Catalog
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { label: "Cartoon Styles (8 Canonical)", items: config.creativePresets.cartoonStyles },
              { label: "Narration Tones", items: config.creativePresets.narrationTones },
              { label: "Visual Pacing Modes", items: config.creativePresets.visualPacing },
              { label: "Camera Movement Presets", items: config.creativePresets.cameraMovement },
              { label: "Scene Transitions", items: config.creativePresets.transitions },
              { label: "Caption Options", items: config.creativePresets.captionOptions },
              { label: "Music Mood Tags", items: config.creativePresets.musicMoods },
            ].map((group) => (
              <div
                key={group.label}
                className="rounded-[10px] border border-beevo-border bg-[#FAF8F3] p-4"
              >
                <h3 className="text-[12px] font-extrabold uppercase tracking-[0.05em] text-beevo-muted">
                  {group.label}
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {group.items.map((val) => (
                    <span
                      key={val}
                      className="rounded-[6px] border border-beevo-border bg-white px-2.5 py-1 text-[12px] font-semibold text-beevo-ink"
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdminConfirmDialog
        open={pendingSection !== null}
        title={`Confirm ${pendingSection ?? "Configuration"} Update`}
        description="System configuration changes affect live customer checkout, credit reservations, or render workers. Confirming requires a documented operational reason and writes an immutable entry in /admin/audit-logs."
        confirmLabel="Authorize & Apply"
        tone="warning"
        requireReason
        requireTypedPhrase="APPLY CONFIG"
        onClose={() => setPendingSection(null)}
        onConfirm={(reason) => {
          setFeedback(
            `Validated audited configuration update for "${pendingSection}" (reason: "${reason}"). Persisting to server config store activates in Phase 4 PATCH /api/admin/configuration.`
          );
          setPendingSection(null);
        }}
      />
    </div>
  );
}
