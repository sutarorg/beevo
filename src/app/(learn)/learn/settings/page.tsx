"use client";

import { BellRing, CircleAlert, LogOut, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getLearnerService, resetLearnerMockData } from "@/lib/services/learner";
import { ConfirmDialog } from "@/components/creator/dialogs";
import { PageHeader } from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function LearnerSettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const service = getLearnerService();
  const session = service?.getSession();
  const [lessonEmails, setLessonEmails] = useState(true);
  const [receiptEmails, setReceiptEmails] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" sub="Your learner account and preferences." />

      <div className="space-y-5">
        <section aria-labelledby="learn-account" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
          <h2 id="learn-account" className="flex items-center gap-2 text-base font-bold text-ink">
            <UserRound className="size-4.5 text-accent" aria-hidden="true" /> Account
          </h2>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-ink/10 bg-cream p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-sm font-bold">
              {session?.profile?.name.split(" ").map((part) => part[0]).join("") ?? "?"}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{session?.profile?.name ?? "Demo learner"}</p>
              <p className="text-xs text-smoke">{session?.profile?.email}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-smoke">
            Password and email changes run through the authentication provider — wired in Prompt 5.
          </p>
        </section>

        <section aria-labelledby="learn-ntf" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
          <h2 id="learn-ntf" className="flex items-center gap-2 text-base font-bold text-ink">
            <BellRing className="size-4.5 text-accent" aria-hidden="true" /> Email preferences
          </h2>
          <div className="mt-4 space-y-2.5">
            {(
              [
                {
                  label: "New lesson announcements",
                  description: "When a creator adds lessons to a course you own.",
                  value: lessonEmails,
                  set: setLessonEmails,
                },
                {
                  label: "Purchase receipts",
                  description: "Receipts and access links after every purchase. Keep this on.",
                  value: receiptEmails,
                  set: setReceiptEmails,
                },
              ] as const
            ).map((pref) => (
              <div key={pref.label} className="flex items-center justify-between gap-4 rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-ink">{pref.label}</p>
                  <p className="text-xs text-smoke">{pref.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pref.value}
                  aria-label={pref.label}
                  onClick={() => {
                    pref.set(!pref.value);
                    toast.push({ variant: "success", title: "Preference saved (demo)" });
                  }}
                  className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors ${pref.value ? "bg-lime" : "bg-parchment"}`}
                >
                  <span className={`absolute top-0.5 size-5 rounded-full border-2 border-ink bg-white transition-all ${pref.value ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="learn-danger" className="rounded-3xl border-2 border-accent-deep bg-accent/5 p-5 sm:p-6">
          <h2 id="learn-danger" className="flex items-center gap-2 text-base font-bold text-accent-deep">
            <CircleAlert className="size-4.5" aria-hidden="true" /> Session & data
          </h2>
          <p className="mt-2 text-sm text-smoke">
            Sign out of this demo learner, or wipe all demo progress, purchases, and session data
            back to the seed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setConfirmSignOut(true)}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out (demo)
            </Button>
            <Button variant="accent" size="sm" onClick={() => setConfirmReset(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Reset demo data
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        body="Your demo progress and purchases stay saved for the next sign-in on this device."
        confirmLabel="Sign out"
        onConfirm={() => {
          service?.signOut();
          toast.push({ variant: "info", title: "Signed out (demo)" });
          router.refresh();
          setConfirmSignOut(false);
          router.push("/learn/courses");
          router.refresh();
        }}
        onCancel={() => setConfirmSignOut(false)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset learner demo data?"
        body="All demo progress, purchases, and the sign-in session are wiped and re-seeded. This only affects this browser."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          resetLearnerMockData();
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
