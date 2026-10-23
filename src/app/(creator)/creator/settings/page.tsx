"use client";

import { BellRing, CircleAlert, KeyRound, Landmark, LifeBuoy, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAsyncData } from "@/lib/hooks";
import type { CreatorSettings } from "@/lib/creator-types";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { ConfirmDialog } from "@/components/creator/dialogs";
import { FailedState, PageHeader, Skeleton } from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3">
      <div>
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="text-xs text-smoke">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors ${checked ? "bg-lime" : "bg-parchment"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full border-2 border-ink bg-white transition-all ${checked ? "left-5.5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

export default function CreatorSettingsPage() {
  const toast = useToast();
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getSettings()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [override, setOverride] = useState<CreatorSettings | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const settings: CreatorSettings | null =
    override ?? (state.status === "success" ? state.data : null);

  const savePreference = async (
    key: "notifySaleEmails" | "notifyWeeklySummary" | "notifyProductTips",
    label: string,
    value: boolean,
  ) => {
    if (!service || !settings) return;
    const previous = settings;
    setOverride({ ...settings, [key]: value });
    setSavingKey(key);
    const result = await service.updateSettings({ [key]: value });
    setSavingKey(null);
    if (!result.ok) {
      setOverride(previous);
      toast.push({ variant: "error", title: "Preference not saved", description: result.error.message });
      return;
    }
    setOverride(result.data);
    toast.push({
      variant: "success",
      title: `${label} ${value ? "turned on" : "turned off"}`,
      description: "Saved to your account.",
    });
  };

  return (
    <div>
      <PageHeader title="Settings" sub="Account, notifications, payouts, and the danger zone." />

      {state.status === "error" ? (
        <div className="mb-5">
          <FailedState body={state.error.message} onRetry={reload} />
        </div>
      ) : null}

      <div className="space-y-5">
        {/* Account */}
        <section aria-labelledby="settings-account" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
          <h2 id="settings-account" className="flex items-center gap-2 text-base font-bold text-ink">
            <KeyRound className="size-4.5 text-accent" aria-hidden="true" /> Account
          </h2>
          <dl className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3">
              <div>
                <dt className="text-xs font-bold tracking-wide text-smoke uppercase">Sign-in email</dt>
                <dd className="text-sm font-bold text-ink">
                  {settings?.email ?? <Skeleton className="h-4 w-40" />}
                </dd>
              </div>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-smoke">
            To change your password, use the{" "}
            <Link href="/forgot-password" className="font-semibold text-accent underline underline-offset-2">
              password reset flow
            </Link>
            . Email changes are handled by support so your account stays secure.
          </p>
        </section>

        {/* Notifications */}
        <section aria-labelledby="settings-ntf" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
          <h2 id="settings-ntf" className="flex items-center gap-2 text-base font-bold text-ink">
            <BellRing className="size-4.5 text-accent" aria-hidden="true" /> Email notifications
          </h2>
          <div className="mt-4 space-y-2.5">
            <Toggle
              label="New sale emails"
              description="A heads-up every time someone enrols."
              checked={settings?.notifySaleEmails ?? false}
              onChange={(value) => void savePreference("notifySaleEmails", "New sale emails", value)}
            />
            <Toggle
              label="Weekly summary"
              description="Sales, enrolments, and payout status every Monday."
              checked={settings?.notifyWeeklySummary ?? false}
              onChange={(value) => void savePreference("notifyWeeklySummary", "Weekly summary", value)}
            />
            <Toggle
              label="Product tips"
              description="Occasional, unsubscribe-anytime advice for selling more."
              checked={settings?.notifyProductTips ?? false}
              onChange={(value) => void savePreference("notifyProductTips", "Product tips", value)}
            />
          </div>
        </section>

        {/* Payout details */}
        <section aria-labelledby="settings-payout" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
          <h2 id="settings-payout" className="flex items-center gap-2 text-base font-bold text-ink">
            <Landmark className="size-4.5 text-accent" aria-hidden="true" /> Payout details
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            Add the bank account and IFSC where your earnings should be transferred. Payouts are
            recorded manually by platform administration under the intended payment arrangement,
            subject to provider approval.
          </p>
          <Button href="/creator/earnings" variant="outline" size="sm" className="mt-4">
            <Landmark className="size-4" aria-hidden="true" />
            Manage payout details
          </Button>
        </section>

        {/* Danger zone */}
        <section aria-labelledby="settings-danger" className="rounded-3xl border-2 border-accent-deep bg-accent/5 p-5 sm:p-6">
          <h2 id="settings-danger" className="flex items-center gap-2 text-base font-bold text-accent-deep">
            <CircleAlert className="size-4.5" aria-hidden="true" /> Danger zone
          </h2>
          <p className="mt-2 text-sm text-smoke">
            Deleting your account removes your profile and drafts. Courses with enrolled students
            stay accessible to them, per the Terms.
          </p>
          <Button variant="accent" size="sm" className="mt-4" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Delete account
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Request account deletion?"
        body={
          <>
            This opens a support request. Our team verifies ownership and handles the deletion with
            you — courses with enrolled students stay accessible to them, per the Terms.
          </>
        }
        confirmLabel="Send deletion request"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!service) return;
          setDeleting(true);
          const result = await service.submitSupportTicket({
            category: "Account",
            subject: "Account deletion request",
            body: `The creator${settings?.email ? ` (${settings.email})` : ""} has requested deletion of their Beevo account and all associated creator data.`,
          });
          setDeleting(false);
          setConfirmDelete(false);
          if (!result.ok) {
            toast.push({
              variant: "error",
              title: "Request not sent",
              description: result.error.message,
            });
            return;
          }
          toast.push({
            variant: "success",
            title: "Deletion request sent",
            description: "Support will confirm once your account is verified and removed.",
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
