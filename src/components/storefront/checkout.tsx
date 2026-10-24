"use client";

import {
  BadgeCheck,
  Banknote,
  CircleAlert,
  Clock3,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/domain";
import type { CheckoutOrder, PaymentReceipt, PublicCoursePage } from "@/lib/learner-types";
import { getCheckoutService, type CheckoutReadiness } from "@/lib/services/checkout";
import { getLearnerService } from "@/lib/services/learner";
import { fetchSession, isMockAuth } from "@/lib/services/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

/** Loads the official Razorpay Checkout.js once per page. */
let razorpayScriptPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  razorpayScriptPromise ??= new Promise<void>((resolve, reject) => {
    if (typeof window !== "undefined" && "Razorpay" in window) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("checkout_js_load_failed"));
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

type UiState =
  | { stage: "ready" }
  | { stage: "creating_order" }
  | { stage: "sign_in"; email?: string }
  | { stage: "checkout_open"; order: CheckoutOrder }
  | { stage: "processing"; order: CheckoutOrder }
  | { stage: "pending"; order: CheckoutOrder }
  | { stage: "success"; order: CheckoutOrder; receipt: PaymentReceipt }
  | { stage: "failed"; order: CheckoutOrder; message: string }
  | { stage: "cancelled" };

/**
 * Mock checkout — the full payment state machine against the checkout
 * service contract. NO real payment is processed; the simulated gateway
 * panel offers explicit success/failure/pending/cancel paths so every state
 * can be exercised. Sign-in happens inline and preserves the course context.
 */
export function CheckoutSheet({
  course,
  open,
  onClose,
  onPurchased,
}: {
  course: PublicCoursePage;
  open: boolean;
  onClose: () => void;
  onPurchased: (courseId: string) => void;
}) {
  const toast = useToast();
  const checkout = getCheckoutService();
  const learner = getLearnerService();
  const [state, setState] = useState<UiState>({ stage: "ready" });
  const [email, setEmail] = useState("kavya.learns@example.in");
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<CheckoutReadiness | null>(null);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  // Reset when reopened for a different course / fresh attempt.
  useEffect(() => {
    if (open && state.stage === "cancelled") setState({ stage: "ready" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Ask the server whether this deployment can take a payment. This turns an
  // opaque "Couldn't start checkout" toast into a specific, fixable reason
  // (missing keys, live mode not enabled, …) before the buyer tries.
  const probeReadiness = async () => {
    if (!checkout) return;
    setCheckingReadiness(true);
    const result = await checkout.getStatus();
    setCheckingReadiness(false);
    if (result.ok) setReadiness(result.data);
  };

  useEffect(() => {
    if (!open) return;
    setStartError(null);
    setAlreadyEnrolled(false);
    void probeReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const busy =
    state.stage === "creating_order" ||
    state.stage === "processing" ||
    state.stage === "pending";

  const beginCheckout = async () => {
    if (!checkout) {
      setStartError("Checkout isn't available in this build. Try again in a moment.");
      return;
    }
    setStartError(null);
    setState({ stage: "creating_order" });
    const result = await checkout.createOrder(course.id);
    if (!result.ok) {
      if (result.error.code === "auth_required") {
        setState({ stage: "sign_in" });
        return;
      }
      if (result.error.code === "already_enrolled") {
        setAlreadyEnrolled(true);
        setState({ stage: "ready" });
        return;
      }
      // Keep the reason visible inside the sheet — a toast disappears before
      // the buyer can act on configuration guidance.
      setStartError(result.error.message);
      setState({ stage: "ready" });
      toast.push({ variant: "error", title: "Couldn't start checkout", description: result.error.message });
      void probeReadiness();
      return;
    }
    setState({ stage: "checkout_open", order: result.data });
  };

  const start = async () => {
    if (isMockAuth()) {
      if (learner && !learner.getSession().signedIn) {
        setState({ stage: "sign_in" });
        return;
      }
      void beginCheckout();
      return;
    }
    // Live: verify the server-side session before creating an order.
    setState({ stage: "creating_order" });
    const session = await fetchSession();
    if (!session.user) {
      setState({ stage: "sign_in" });
      return;
    }
    void beginCheckout();
  };

  const signIn = async () => {
    if (!learner) return;
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setSignInError("Enter a valid email to continue.");
      return;
    }
    if (!isMockAuth()) {
      // Live: hand off to the real login page; the course stays the `next` hop.
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setSigningIn(true);
    setSignInError(null);
    const result = await learner.signIn(clean);
    setSigningIn(false);
    if (!result.ok) {
      setSignInError(result.error.message);
      return;
    }
    // Handoff preserves the course — straight back into checkout.
    void beginCheckout();
  };

  // --- Real Razorpay checkout (live flow) ---
  const launchRazorpay = async () => {
    if (!checkout || state.stage !== "checkout_open") return;
    const { order } = state;
    if (order.gateway !== "razorpay" || !order.razorpayOrderId) return;
    try {
      await loadRazorpayScript();
    } catch {
      setState({
        stage: "failed",
        order,
        message: "Couldn't load the secure payment window. Check your connection and retry.",
      });
      return;
    }
    const RazorpayCtor = (window as unknown as { Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (payload: unknown) => void) => void } }).Razorpay;
    if (!RazorpayCtor) {
      setState({ stage: "failed", order, message: "The payment library failed to initialise." });
      return;
    }
    setState({ stage: "processing", order });
    const rzp = new RazorpayCtor({
      key: order.keyId,
      amount: order.amountInPaise,
      currency: "INR",
      name: "Beevo",
      description: order.courseTitle,
      order_id: order.razorpayOrderId,
      prefill: order.buyer ? { name: order.buyer.name, email: order.buyer.email } : undefined,
      theme: { color: "#e8490f" },
      modal: {
        ondismiss: () => {
          setState({ stage: "cancelled" });
        },
      },
      handler: async (response: unknown) => {
        const payload = response as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
        const verified = await checkout.verifyPayment({
          orderId: order.orderId,
          razorpayOrderId: payload.razorpay_order_id,
          razorpayPaymentId: payload.razorpay_payment_id,
          razorpaySignature: payload.razorpay_signature,
        });
        if (!verified.ok) {
          setState({ stage: "failed", order, message: verified.error.message });
          return;
        }
        setState({
          stage: "success",
          order,
          receipt: {
            paymentId: verified.data.paymentId,
            orderId: order.orderId,
            amountInPaise: order.amountInPaise,
            note: "Payment verified by the server — you're enrolled.",
          },
        });
      },
    });
    rzp.on("payment.failed", (payload: unknown) => {
      const description = (payload as { error?: { description?: string } })?.error?.description;
      setState({
        stage: "failed",
        order,
        message: description ? `Payment failed: ${description}` : "Payment failed at the provider. No access was granted.",
      });
    });
    rzp.open();
  };

  const settle = async (outcome: "success" | "failed" | "pending") => {
    if (!checkout || state.stage !== "checkout_open") return;
    const { order } = state;
    if (outcome === "pending") {
      setState({ stage: "pending", order });
      const resolved = await checkout.confirmPendingPayment(order.orderId);
      if (!resolved.ok) {
        setState({ stage: "failed", order, message: resolved.error.message });
        return;
      }
      await completePurchase(order, resolved.data);
      return;
    }
    setState({ stage: "processing", order });
    const result = await checkout.settlePayment(order.orderId, outcome);
    if (!result.ok) {
      setState({ stage: "failed", order, message: result.error.message });
      return;
    }
    await completePurchase(order, result.data);
  };

  const completePurchase = async (order: CheckoutOrder, receipt: PaymentReceipt) => {
    if (learner) {
      const enrolment = await learner.recordDemoPurchase(order);
      if (!enrolment.ok) {
        setState({ stage: "failed", order, message: "Payment simulated OK, but enrolment recording failed. Retry — no money moved." });
        return;
      }
    }
    setState({ stage: "success", order, receipt });
  };

  const cancel = () => {
    if (busy) return;
    setState({ stage: "cancelled" });
  };

  const retryFromFailed = () => {
    if (state.stage === "failed") setState({ stage: "checkout_open", order: state.order });
  };

  const close = () => {
    if (state.stage === "checkout_open") {
      setState({ stage: "cancelled" });
      return;
    }
    if (busy) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/60"
        onClick={close}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-2 border-ink bg-cream shadow-hard sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-white px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Lock className="size-4 text-moss" aria-hidden="true" />
            {state.stage === "sign_in" ? "Sign in to enrol" : "Secure checkout"}
            {isMockAuth() ? (
              <span className="rounded-full border border-dashed border-accent/60 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-accent-deep uppercase">
                Test mode
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close checkout"
            className="grid size-9 place-items-center rounded-full border-2 border-ink bg-cream transition-colors hover:bg-lime disabled:opacity-40"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {/* Course context — always visible, preserved through sign-in */}
          <div className="mb-4 rounded-2xl border-2 border-ink bg-white p-3.5">
            <p className="text-[10px] font-bold tracking-[0.18em] text-smoke uppercase">You’re buying</p>
            <p className="mt-1 text-sm font-bold text-ink">{course.title}</p>
            <p className="text-xs text-smoke">
              by {course.creator.displayName} · <span className="font-bold text-ink tabular-nums">{formatINR(course.priceInPaise)}</span>
            </p>
          </div>

          {state.stage === "ready" ? (
            <div className="space-y-3 py-4">
              {alreadyEnrolled ? (
                <div className="rounded-2xl border-2 border-ink bg-lime/40 p-4 text-left">
                  <p className="text-sm font-bold text-ink">You already own this course</p>
                  <p className="mt-1 text-xs leading-relaxed text-smoke">
                    “{course.title}” is in your library — no second payment is needed.
                  </p>
                  <Button href="/learn/courses" variant="ink" size="sm" className="mt-3">
                    Open my library
                  </Button>
                </div>
              ) : (
                <>
                  {readiness && !readiness.ready ? (
                    <div className="rounded-2xl border-2 border-accent-deep bg-accent/5 p-4 text-left">
                      <p className="flex items-center gap-2 text-sm font-bold text-accent-deep">
                        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                        Checkout isn't available yet
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-smoke">{readiness.message}</p>
                      <button
                        type="button"
                        onClick={() => void probeReadiness()}
                        className="mt-2 text-xs font-bold text-accent-deep underline underline-offset-2"
                      >
                        {checkingReadiness ? "Checking…" : "Re-check payment status"}
                      </button>
                    </div>
                  ) : null}

                  {startError ? (
                    <div role="alert" className="rounded-2xl border-2 border-accent-deep bg-accent/5 p-4 text-left">
                      <p className="flex items-center gap-2 text-sm font-bold text-accent-deep">
                        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                        Couldn't start checkout
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-smoke">{startError}</p>
                      <button
                        type="button"
                        onClick={() => void beginCheckout()}
                        className="mt-2 text-xs font-bold text-accent-deep underline underline-offset-2"
                      >
                        Try again
                      </button>
                    </div>
                  ) : null}

                  <Button
                    variant="accent"
                    size="lg"
                    onClick={start}
                    className="w-full"
                    disabled={readiness !== null && !readiness.ready}
                  >
                    Continue to payment
                  </Button>
                  {readiness?.ready ? (
                    <p className="text-center text-[10px] font-semibold text-smoke">
                      {readiness.message}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {state.stage === "creating_order" ? (
            <StatePanel
              icon={<Loader2 className="size-6 animate-spin" aria-hidden="true" />}
              title="Creating your order"
              body="Reserving a checkout session…"
            />
          ) : null}

          {state.stage === "sign_in" ? (
            <div>
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
                  <LogIn className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink">One quick step</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-smoke">
                    Courses live in your learner account. Sign in and we’ll bring you straight back
                    here — your course stays selected.
                  </p>
                </div>
              </div>
              <Field id="checkout-email" label="Email" error={signInError ?? undefined}>
                <Input
                  id="checkout-email"
                  type="email"
                  value={email}
                  invalid={Boolean(signInError)}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSignInError(null);
                  }}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </Field>
              <Button variant="accent" size="lg" className="mt-4 w-full" onClick={signIn} loading={signingIn}>
                {isMockAuth() ? "Sign in & continue" : "Continue to sign in"}
              </Button>
              <p className="mt-3 text-center text-[11px] text-smoke">
                {isMockAuth()
                  ? "Demo sign-in — any valid email works."
                  : "You'll sign in on the secure account page and return right here."}
              </p>
            </div>
          ) : null}

          {state.stage === "checkout_open" ? (
            state.order.gateway === "razorpay" ? (
              <div>
                <div className="rounded-2xl border-2 border-ink bg-ink p-4 text-cream">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">
                      Razorpay {state.order.keyId.startsWith("rzp_test_") ? "(test mode)" : ""}
                    </p>
                    <ShieldCheck className="size-4.5 text-lime" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-2xl font-bold tabular-nums">{formatINR(state.order.amountInPaise)}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-cream/50">
                    {state.order.orderId} · payment verified server-side
                  </p>
                  <p className="mt-2 text-[11px] text-cream/60">
                    You'll complete payment in the secure Razorpay window (UPI, card, net‑banking,
                    wallets). Access is granted only after the server verifies the payment signature.
                  </p>
                </div>
                <Button variant="accent" size="lg" className="mt-4 w-full" onClick={launchRazorpay}>
                  <Lock className="size-4" aria-hidden="true" />
                  Pay {formatINR(state.order.amountInPaise)} securely
                </Button>
                <button
                  type="button"
                  onClick={cancel}
                  className="mt-3 w-full text-center text-sm font-semibold text-accent underline underline-offset-4"
                >
                  Cancel payment
                </button>
              </div>
            ) : (
            <div>
              <div className="rounded-2xl border-2 border-ink bg-ink p-4 text-cream">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">
                    Razorpay (test mode)
                  </p>
                  <ShieldCheck className="size-4.5 text-lime" aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums">{formatINR(state.order.amountInPaise)}</p>
                <p className="mt-0.5 font-mono text-[10px] text-cream/50">
                  {state.order.orderId} · key {state.order.keyId}
                </p>
                <p className="mt-2 text-[11px] text-cream/60">
                  Test gateway — choose an outcome to walk through each payment state. No card is
                  charged.
                </p>
              </div>
              <div className="mt-4 space-y-2.5">
                <CheckoutChoice
                  icon={<Smartphone className="size-4.5" aria-hidden="true" />}
                  label="UPI — pay now"
                  note="Simulate a successful payment"
                  onClick={() => settle("success")}
                  primary
                />
                <CheckoutChoice
                  icon={<CreditCard className="size-4.5" aria-hidden="true" />}
                  label="Card — decline"
                  note="Simulate a failed payment"
                  onClick={() => settle("failed")}
                />
                <CheckoutChoice
                  icon={<Landmark className="size-4.5" aria-hidden="true" />}
                  label="Net-banking — bank pending"
                  note="Simulate a pending confirmation"
                  onClick={() => settle("pending")}
                />
              </div>
              <button
                type="button"
                onClick={cancel}
                className="mt-4 w-full text-center text-sm font-semibold text-accent underline underline-offset-4"
              >
                Cancel payment
              </button>
            </div>
            )
          ) : null}

          {state.stage === "processing" ? (
            <StatePanel
              icon={<Loader2 className="size-6 animate-spin" aria-hidden="true" />}
              title="Processing payment"
              body="Talking to your bank… (simulated)"
            />
          ) : null}

          {state.stage === "pending" ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-sand">
                <Clock3 className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">Payment pending</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-smoke">
                Your bank hasn&apos;t confirmed yet. We&apos;ll unlock the course automatically the
                moment it does — nothing is charged twice.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold text-smoke">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Checking with the bank…
              </div>
            </div>
          ) : null}

          {state.stage === "success" ? (
            <div className="py-2 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-hard-xs">
                <BadgeCheck className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">You’re in!</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-smoke">
                {state.order.courseTitle} is now in your library. A receipt was “emailed” to you.
              </p>
              <p className="mt-2 font-mono text-[10px] text-smoke">{state.receipt.paymentId}</p>
              <p className="mt-1 text-[10px] font-bold text-accent-deep">{state.receipt.note}</p>
              <div className="mt-5 space-y-2.5">
                <Button href="/learn/courses" variant="ink" size="lg" className="w-full" onClick={() => onPurchased(course.id)}>
                  Start learning
                </Button>
                <Button href="/learn/purchases" variant="outline" size="sm" className="w-full" onClick={() => onPurchased(course.id)}>
                  View purchase history
                </Button>
              </div>
            </div>
          ) : null}

          {state.stage === "failed" ? (
            <div className="py-2 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-accent text-cream">
                <CircleAlert className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">Payment failed</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-smoke">{state.message}</p>
              <div className="mt-5 space-y-2.5">
                <Button variant="accent" className="w-full" onClick={retryFromFailed}>
                  Try another method
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setState({ stage: "cancelled" })}>
                  Cancel checkout
                </Button>
              </div>
            </div>
          ) : null}

          {state.stage === "cancelled" ? (
            <div className="py-2 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-parchment">
                <Banknote className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">Checkout cancelled</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-smoke">
                No payment was attempted (and this is a simulation — no money can move). Your course
                is waiting whenever you are.
              </p>
              <div className="mt-5 space-y-2.5">
                <Button variant="accent" className="w-full" onClick={() => setState({ stage: "ready" })}>
                  Resume checkout
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
                  Back to course page
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t-2 border-ink bg-white px-5 py-3">
          <p className="text-center text-[10px] leading-relaxed text-smoke">
            {isMockAuth()
              ? "Test-mode checkout — no real payment is taken. Course purchases are non-refundable except where required by applicable law."
              : "Payments are processed securely by Razorpay. Course purchases are non-refundable except where required by applicable law."}
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutChoice({
  icon,
  label,
  note,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  note: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border-2 border-ink px-4 py-3 text-left transition-transform hover:-translate-y-0.5",
        primary ? "bg-lime shadow-hard-xs" : "bg-white",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-ink">{label}</span>
        <span className="block text-xs text-smoke">{note}</span>
      </span>
    </button>
  );
}

function StatePanel({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="py-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-lime">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-smoke">{body}</p>
    </div>
  );
}
