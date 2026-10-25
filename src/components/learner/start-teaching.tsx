"use client";

import { Check, Presentation, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PLATFORM_COMMISSION_LABEL } from "@/lib/domain";
import { startTeaching } from "@/lib/services/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * "Start teaching" — upgrades the signed-in learner account to also be a
 * creator account on the same email.
 *
 * The card lives in the learner sidebar above the account block. Tapping it
 * opens the creator-terms popup; only the explicit "I agree" (checkbox +
 * button) calls POST auth/start-teaching, which records the acceptance,
 * assigns the storefront handle, and unlocks the creator studio. Courses
 * already bought stay in the learner library — nothing is replaced, the
 * email simply holds both accounts from then on (and the Learner/Creator
 * toggle starts appearing in the headers).
 */

const CREATOR_TERMS_POINTS: readonly string[] = [
  "You keep ownership of your courses and are responsible for your content, its accuracy, and having the rights to sell it.",
  `Beevo is free (₹0/month). On each successful eligible course sale, Beevo keeps a ${PLATFORM_COMMISSION_LABEL} commission; payment-gateway charges and taxes apply as per the provider.`,
  "Beevo is not a marketplace: there is no public catalogue or recommendation feed. You bring your own audience to your storefront link.",
  "Course purchases are non-refundable except where required by law. If a payment is reversed or a chargeback happens, that sale is reversed from your payable balance.",
  "Earnings are transferred to the payout details you save in Creator settings, under the payment arrangement in effect. Keep those details accurate.",
  "Don't publish infringing, illegal, or misleading content. Accounts that break the Terms can be suspended.",
  "Learners who buy from you can be shown to you in limited form (name, email, enrolment) only so you can manage your courses.",
];

export function StartTeachingCard({
  autoOpen = false,
  variant = "sidebar",
}: {
  /** Open the terms popup immediately (deep link from the creator studio). */
  autoOpen?: boolean;
  variant?: "sidebar" | "banner";
}) {
  const toast = useToast();
  const [open, setOpen] = useState(autoOpen);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoOpen) return;
    const frame = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const agree = async () => {
    if (!agreed || busy) return;
    setBusy(true);
    setError(null);
    const result = await startTeaching();
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      toast.push({
        variant: "error",
        title: "Couldn't enable Creator",
        description: result.error.message,
      });
      return;
    }
    toast.push({
      variant: "success",
      title: "You're a creator now",
      description: "Your creator studio is ready — your courses stay in My learning.",
    });
    window.location.assign("/creator/dashboard");
  };

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              className="anim-fade-in fixed inset-0 z-[85] bg-ink/60"
              onClick={() => !busy && setOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-0 z-[86] flex items-end justify-center sm:items-center sm:p-6">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Start teaching on Beevo"
                className="anim-rise-in flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-2 border-ink bg-cream shadow-hard sm:max-w-lg sm:rounded-3xl"
              >
                <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-white px-5 py-3.5">
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-accent uppercase">
                      <Presentation className="size-3.5" aria-hidden="true" />
                      Start teaching
                    </p>
                    <h2 className="mt-0.5 text-base font-bold text-ink sm:text-lg">
                      Turn this account into a creator account
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                    aria-label="Close"
                    className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream transition-colors hover:bg-lime disabled:opacity-40"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="overflow-y-auto p-5">
                  <p className="text-sm leading-relaxed text-smoke">
                    Same email, one extra account: your learner library stays exactly as it is,
                    and a creator studio (with your own storefront) is added. Please read the
                    creator terms first:
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {CREATOR_TERMS_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink">
                        <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime">
                          <Check className="size-2.5" strokeWidth={3.5} aria-hidden="true" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[11px] leading-relaxed text-smoke">
                    These points summarise the creator terms in our{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-accent underline underline-offset-2"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/refund-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-accent underline underline-offset-2"
                    >
                      Refund Policy
                    </Link>
                    , which apply in full.
                  </p>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink bg-white p-3.5">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                      className="mt-0.5 size-4.5 shrink-0 accent-[#e8490f]"
                    />
                    <span className="text-xs leading-relaxed font-semibold text-ink">
                      I agree to the creator terms above and want to enable Creator on this
                      account.
                    </span>
                  </label>

                  {error ? (
                    <p role="alert" className="mt-3 text-xs font-semibold text-accent-deep">
                      {error}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 border-t-2 border-ink bg-white px-5 py-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                  >
                    Not now
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={() => void agree()}
                    disabled={!agreed || busy}
                    loading={busy}
                  >
                    <Presentation className="size-4" aria-hidden="true" />
                    I agree — start teaching
                  </Button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border-2 border-ink bg-lime p-3.5 shadow-hard-xs",
          variant === "banner" && "flex items-center justify-between gap-3",
        )}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
            Start teaching
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/75">
            Sell your own course from this same account. Free — {PLATFORM_COMMISSION_LABEL} only
            when you sell.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "shrink-0 rounded-full border-2 border-ink bg-ink px-3.5 py-1.5 text-[11px] font-bold text-cream transition-transform hover:-translate-y-0.5",
            variant === "sidebar" && "mt-2.5 w-full py-2 text-xs",
          )}
        >
          Become a creator
        </button>
      </div>
      {dialog}
    </>
  );
}
