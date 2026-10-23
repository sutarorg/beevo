"use client";

import { BellRing, CircleAlert, LifeBuoy, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LearnerSettings } from "@/lib/learner-types";
import { useAsyncData } from "@/lib/hooks";
import { getLearnerService } from "@/lib/services/learner";
import { ConfirmDialog } from "@/components/creator/dialogs";
import { FailedState, PageHeader, Skeleton } from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors disabled:opacity-60 ${checked ? "bg-lime" : "bg-parchment"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full border-2 border-ink bg-white transition-all ${checked ? "left-5.5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

export default function LearnerSettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const service = getLearnerService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getSettings()
        : Promise.resolve({
            ok: false as const,
            error: { code: "unavailable", message: "Service unavailable" },
          }),
    [],
  );
  const [override, setOverride] = useState<LearnerSettings | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const settings: LearnerSettings | null =
    override ?? (state.status === "success" ? state.data : null);

  const savePreference = async (
    key: "notifyLessonEmails" | "notifyReceiptEmails",
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
      toast.push({
        variant: "error",
        title: "Preference not saved",
        description: result.error.message,
      });
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
      <PageHeader title="Settings" sub="Your learner account and preferences." />

      {state.status === "error" ? (
        <div className="mb-5">
          <FailedState body={state.error.message} onRetry={reload} />
        </div>
      ) : null}

      <div className="space-y-5">
        <section
          aria-labelledby="learn-account"
          className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6"
        >
          <h2 id="learn-account" className="flex items-center gap-2 text-base font-bold text-ink">
            <UserRound className="size-4.5 text-accent" aria-hidden="true" /> Account
          </h2>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-ink/10 bg-cream p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-sm font-bold">
              {settings?.name
                ? settings.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {settings?.name ?? <Skeleton className="h-4 w-32" />}
              </p>
              <p className="truncate text-xs text-smoke">{settings?.email}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-smoke">
            To change your password, use the{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-accent underline underline-offset-2"
            >
              password reset flow
            </Link>
            . Email changes are handled by support so your account stays secure.
          </p>
        </section>

        <section
          aria-labelledby="learn-ntf"
          className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6"
        >
          <h2 id="learn-ntf" className="flex items-center gap-2 text-base font-bold text-ink">
            <BellRing className="size-4.5 text-accent" aria-hidden="true" /> Email preferences
          </h2>
          <div className="mt-4 space-y-2.5">
            <Toggle
              label="New lesson announcements"
              description="When a creator adds lessons to a course you own."
              checked={settings?.notifyLessonEmails ?? true}
              disabled={!settings || savingKey === "notifyLessonEmails"}
              onChange={(value) => savePreference("notifyLessonEmails", "Lesson announcements", value)}
            />
            <Toggle
              label="Purchase receipts"
              description="Receipts and access links after every purchase. Keep this on."
              checked={settings?.notifyReceiptEmails ?? true}
              disabled={!settings || savingKey === "notifyReceiptEmails"}
              onChange={(value) => savePreference("notifyReceiptEmails", "Purchase receipts", value)}
            />
          </div>
        </section>

        <section
          aria-labelledby="learn-danger"
          className="rounded-3xl border-2 border-accent-deep bg-accent/5 p-5 sm:p-6"
        >
          <h2 id="learn-danger" className="flex items-center gap-2 text-base font-bold text-accent-deep">
            <CircleAlert className="size-4.5" aria-hidden="true" /> Session & data
          </h2>
          <p className="mt-2 text-sm text-smoke">
            Sign out of this device, or ask us to delete your account and learning history.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setConfirmSignOut(true)}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
            <Button variant="accent" size="sm" href="/learn/support">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Request account deletion
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        body="Your progress and purchases stay saved on your account for the next sign-in."
        confirmLabel="Sign out"
        onConfirm={() => {
          service?.signOut();
          toast.push({ variant: "info", title: "Signed out" });
          setConfirmSignOut(false);
          router.push("/learn/courses");
          router.refresh();
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
