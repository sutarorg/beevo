"use client";

import { Banknote, Construction, Flag, GraduationCap, Landmark, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { PaymentFeatureFlags } from "@/lib/admin-types";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { StatusPill } from "@/components/admin/ui";
import { CardListSkeleton, FailedState, PageHeader } from "@/components/creator/ui";
import { useToast } from "@/components/ui/toast";

export default function AdminSettingsPage() {
  const toast = useToast();
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getSettings()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [saving, setSaving] = useState<string | null>(null);

  const update = async (patch: Partial<PaymentFeatureFlags>, label: string) => {
    if (!service) return;
    const key = Object.keys(patch).join(",");
    setSaving(key);
    const result = await service.updateSettings(patch);
    setSaving(null);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't update flags", description: result.error.message });
      return;
    }
    toast.push({ variant: "success", title: `${label} updated`, description: "Written to the audit log." });
    reload();
  };

  return (
    <div>
      <PageHeader title="Platform settings" sub="Configuration and feature flags. Payment integration status is provider-gated, not a button we can press.">
      </PageHeader>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={3} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : (
        <div className="space-y-5">
          {/* Payment integration */}
          <section aria-labelledby="pay-integration" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <h2 id="pay-integration" className="flex items-center gap-2 text-base font-bold text-ink">
              <Banknote className="size-4.5 text-accent" aria-hidden="true" /> Payment integration
            </h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 bg-cream p-4">
              <div>
                <p className="text-sm font-bold text-ink">Razorpay connection</p>
                <p className="mt-0.5 text-xs leading-relaxed text-smoke">
                  The intended manual payout arrangement runs subject to payment-provider approval.
                  Connection status reflects the keys and webhook secret configured on the server.
                </p>
              </div>
              <StatusPill
                label={state.data.razorpayConnection.replace(/_/g, " ")}
                tone={state.data.razorpayConnection === "connected" ? "lime" : "sand"}
              />
            </div>
            <p className="mt-3 text-[11px] text-smoke">
              This status is read-only here — it flips when the provider actually approves and wires
              the account, never from a UI toggle.
            </p>
          </section>

          {/* Feature flags */}
          <section aria-labelledby="flags" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <h2 id="flags" className="flex items-center gap-2 text-base font-bold text-ink">
              <Flag className="size-4.5 text-accent" aria-hidden="true" /> Feature flags
            </h2>
            <div className="mt-4 space-y-2.5">
              <FlagRow
                icon={<Landmark className="size-4.5" aria-hidden="true" />}
                label="Manual payout recording"
                description="Allows admins to create payout records and attach transfer references. Turning it off disables the recording workflow everywhere."
                checked={state.data.manualPayoutRecording}
                disabled={saving !== null}
                onChange={(value) => void update({ manualPayoutRecording: value }, "Payout recording")}
              />
              <FlagRow
                icon={<GraduationCap className="size-4.5" aria-hidden="true" />}
                label="Learner signups"
                description="Allows new learner accounts to be created at checkout. Off = existing learners can still log in."
                checked={state.data.learnerSignups}
                disabled={saving !== null}
                onChange={(value) => void update({ learnerSignups: value }, "Learner signups")}
              />
              <FlagRow
                icon={<Construction className="size-4.5" aria-hidden="true" />}
                label="Maintenance mode"
                description="Public storefronts show a maintenance notice; admin console stays available."
                checked={state.data.maintenanceMode}
                disabled={saving !== null}
                onChange={(value) => void update({ maintenanceMode: value }, "Maintenance mode")}
              />
            </div>
          </section>

          {/* Static config */}
          <section aria-labelledby="config" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <h2 id="config" className="flex items-center gap-2 text-base font-bold text-ink">
              <Settings2 className="size-4.5 text-accent" aria-hidden="true" /> Fixed configuration
            </h2>
            <dl className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-ink/10 bg-cream p-4">
                <dt className="text-[10px] font-bold tracking-wide text-smoke uppercase">Creator plan</dt>
                <dd className="mt-1 text-sm font-bold text-ink">Free — ₹0/month (no other tiers)</dd>
              </div>
              <div className="rounded-2xl border-2 border-ink/10 bg-cream p-4">
                <dt className="text-[10px] font-bold tracking-wide text-smoke uppercase">Platform commission</dt>
                <dd className="mt-1 text-sm font-bold text-ink">8% per successful eligible sale</dd>
              </div>
              <div className="rounded-2xl border-2 border-ink/10 bg-cream p-4">
                <dt className="text-[10px] font-bold tracking-wide text-smoke uppercase">Refund policy</dt>
                <dd className="mt-1 text-sm font-bold text-ink">Non-refundable except where required by law</dd>
              </div>
              <div className="rounded-2xl border-2 border-ink/10 bg-cream p-4">
                <dt className="text-[10px] font-bold tracking-wide text-smoke uppercase">Payout method</dt>
                <dd className="mt-1 text-sm font-bold text-ink">Manual records, provider-approved arrangement</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-smoke">
              These are business rules defined in <span className="font-mono">src/lib/domain.ts</span> — not
              editable from the console by design.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function FlagRow({
  icon,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white">
          {icon}
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-smoke">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors disabled:opacity-50 ${checked ? "bg-lime" : "bg-parchment"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full border-2 border-ink bg-white transition-all ${checked ? "left-5.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
