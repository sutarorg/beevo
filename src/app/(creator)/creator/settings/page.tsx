"use client";

import { BellRing, CircleAlert, KeyRound, Landmark, LifeBuoy, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/creator/dialogs";
import { PageHeader } from "@/components/creator/ui";
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
  const [saleEmails, setSaleEmails] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [productTips, setProductTips] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const savePreference = (label: string) => {
    toast.push({ variant: "success", title: `${label} updated (demo)`, description: "Email delivery itself connects in Prompt 5." });
  };

  return (
    <div>
      <PageHeader title="Settings" sub="Account, notifications, payouts, and the danger zone." />

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
                <dd className="text-sm font-bold text-ink">meera@example.in (demo account)</dd>
              </div>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-smoke">
            Password and email changes are handled by the authentication provider. That flow
            connects in Prompt 5 — until then, the public{" "}
            <a href="/forgot-password" className="font-semibold text-accent underline underline-offset-2">
              password reset screens
            </a>{" "}
            show the intended experience.
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
              checked={saleEmails}
              onChange={(value) => {
                setSaleEmails(value);
                savePreference("New sale emails");
              }}
            />
            <Toggle
              label="Weekly summary"
              description="Sales, enrolments, and payout status every Monday."
              checked={weeklySummary}
              onChange={(value) => {
                setWeeklySummary(value);
                savePreference("Weekly summary");
              }}
            />
            <Toggle
              label="Product tips"
              description="Occasional, unsubscribe-anytime advice for selling more."
              checked={productTips}
              onChange={(value) => {
                setProductTips(value);
                savePreference("Product tips");
              }}
            />
          </div>
        </section>

        {/* Payout details */}
        <section aria-labelledby="settings-payout" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
          <h2 id="settings-payout" className="flex items-center gap-2 text-base font-bold text-ink">
            <Landmark className="size-4.5 text-accent" aria-hidden="true" /> Payout details
          </h2>
          <div className="mt-4 rounded-2xl border-2 border-dashed border-ink/40 bg-parchment/60 p-4 text-sm leading-relaxed text-smoke">
            <p>
              Bank and settlement details are <span className="font-semibold text-ink">never</span>{" "}
              collected through this app. They're gathered securely during payment-provider
              onboarding, and payouts are recorded manually by platform administration under the
              intended payment arrangement, subject to provider approval (Prompt 5 wires the secure
              flow).
            </p>
          </div>
          <Button href="/creator/support" variant="outline" size="sm" className="mt-4">
            <LifeBuoy className="size-4" aria-hidden="true" />
            Update payout details via support
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
        title="Delete your account?"
        body={
          <>
            In this demo nothing is actually deleted — the request is simply recorded as a support
            ticket. In production this is a two-step verified flow handled with an administrator.
          </>
        }
        confirmLabel="Request deletion (demo)"
        danger
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          await new Promise((resolve) => setTimeout(resolve, 500));
          setDeleting(false);
          setConfirmDelete(false);
          toast.push({
            variant: "info",
            title: "Deletion request submitted (demo)",
            description: "No data was removed. Real deletion flow arrives with the backend.",
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
