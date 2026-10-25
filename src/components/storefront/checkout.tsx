"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CircleAlert,
  CreditCard,
  Loader2,
  Lock,
  MailCheck,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/domain";
import type {
  CheckoutAccountInfo,
  CheckoutOrder,
  PaymentReceipt,
  PublicCoursePage,
} from "@/lib/learner-types";
import { getCheckoutService, type CheckoutReadiness } from "@/lib/services/checkout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UiState =
  | { stage: "email" }
  | { stage: "sending_code" }
  | { stage: "code"; previewCode?: string }
  | { stage: "verifying_code" }
  | { stage: "ready" }
  | { stage: "creating_order" }
  | { stage: "checkout_open"; order: CheckoutOrder }
  | { stage: "processing"; order: CheckoutOrder }
  | { stage: "success"; order: CheckoutOrder; receipt: PaymentReceipt }
  | { stage: "failed"; order?: CheckoutOrder; message: string; retry: "order" | "gateway" | "verify" }
  | { stage: "cancelled"; order?: CheckoutOrder };

/**
 * Checkout.
 *
 * Email (verified with a one-time code) → payment → account + access. The
 * buyer never leaves this sheet, and the selected course stays in view the
 * whole way through.
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
  const checkout = getCheckoutService();
  const isFree = course.priceInPaise === 0;

  const [state, setState] = useState<UiState>({ stage: "email" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [readiness, setReadiness] = useState<CheckoutReadiness | null>(null);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  // Fresh attempt each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setState({ stage: "email" });
    setCode("");
    setVerificationToken(null);
    setFormError(null);
    setEmailTouched(false);
    setResendNotice(null);
    setAlreadyEnrolled(false);
  }, [open, course.id]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const probeReadiness = async () => {
    if (!checkout || isFree) return;
    setCheckingReadiness(true);
    const result = await checkout.getStatus();
    setCheckingReadiness(false);
    if (result.ok) setReadiness(result.data);
  };

  useEffect(() => {
    if (!open) return;
    void probeReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isFree]);

  if (!open) return null;

  const busy =
    state.stage === "sending_code" ||
    state.stage === "verifying_code" ||
    state.stage === "creating_order" ||
    state.stage === "processing";

  const sendCode = async (resend = false) => {
    if (!checkout) {
      setFormError("Checkout isn't available right now. Try again in a moment.");
      return;
    }
    const clean = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(clean)) {
      setFormError("Enter a valid email address — this is where your access is sent.");
      return;
    }
    setFormError(null);
    setResendNotice(null);
    setState({ stage: "sending_code" });
    const result = await checkout.startEmailVerification(clean);
    if (!result.ok) {
      setFormError(result.error.message);
      setState({ stage: resend ? "code" : "email" });
      return;
    }
    setEmail(result.data.email);
    setCode("");
    setState({ stage: "code", previewCode: result.data.previewCode });
    if (resend) setResendNotice("A new code is on its way. Earlier codes no longer work.");
  };

  const confirmCode = async () => {
    if (!checkout) return;
    const cleanCode = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleanCode)) {
      setFormError("Enter the 6-digit code from the email.");
      return;
    }
    setFormError(null);
    setState({ stage: "verifying_code" });
    const result = await checkout.confirmEmailVerification(email, cleanCode);
    if (!result.ok) {
      setFormError(result.error.message);
      setState({ stage: "code" });
      return;
    }
    setVerificationToken(result.data.verificationToken);
    setState({ stage: "ready" });
  };

  const createOrder = async () => {
    if (!checkout || !verificationToken) {
      setState({ stage: "email" });
      setFormError("Your email verification expired. Verify your email again.");
      return;
    }
    setFormError(null);
    setState({ stage: "creating_order" });
    const result = await checkout.createOrder({
      courseId: course.id,
      email,
      verificationToken,
    });
    if (!result.ok) {
      if (result.error.code === "already_enrolled") {
        setAlreadyEnrolled(true);
        setState({ stage: "ready" });
        return;
      }
      if (result.error.code === "email_not_verified") {
        setVerificationToken(null);
        setState({ stage: "code" });
        setFormError(result.error.message);
        return;
      }
      setState({
        stage: "failed",
        message: result.error.message,
        retry: "order",
      });
      void probeReadiness();
      return;
    }

    const order = result.data;
    if (order.free || order.enrolled) {
      const receipt: PaymentReceipt = {
        paymentId: "free",
        orderId: order.orderId,
        amountInPaise: 0,
        note: "Free course — access granted instantly.",
        enrolled: true,
        account: order.account,
      };
      setState({ stage: "success", order, receipt });
      onPurchased(course.id);
      return;
    }
    setState({ stage: "checkout_open", order });
  };

  const launchRazorpay = async () => {
    if (!checkout || state.stage !== "checkout_open") return;
    const { order } = state;
    if (!order.razorpayOrderId) {
      setState({ stage: "failed", order, message: "This order is incomplete. Start checkout again.", retry: "order" });
      return;
    }
    try {
      await loadRazorpayScript();
    } catch {
      setState({
        stage: "failed",
        order,
        message: "Couldn't load the secure payment window. Check your connection and retry.",
        retry: "gateway",
      });
      return;
    }
    const RazorpayCtor = (
      window as unknown as {
        Razorpay?: new (options: Record<string, unknown>) => {
          open: () => void;
          on: (event: string, cb: (payload: unknown) => void) => void;
        };
      }
    ).Razorpay;
    if (!RazorpayCtor) {
      setState({ stage: "failed", order, message: "The payment library failed to initialise.", retry: "gateway" });
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
          setState({ stage: "cancelled", order });
        },
      },
      handler: async (response: unknown) => {
        const payload = response as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
        setState({ stage: "processing", order });
        const verified = await checkout.verifyPayment({
          orderId: order.orderId,
          razorpayOrderId: payload.razorpay_order_id,
          razorpayPaymentId: payload.razorpay_payment_id,
          razorpaySignature: payload.razorpay_signature,
        });
        if (!verified.ok) {
          setState({ stage: "failed", order, message: verified.error.message, retry: "verify" });
          return;
        }
        setState({
          stage: "success",
          order,
          receipt: {
            paymentId: verified.data.paymentId,
            orderId: order.orderId,
            amountInPaise: order.amountInPaise,
            note: verified.data.note,
            enrolled: verified.data.enrolled,
            account: verified.data.account,
          },
        });
        onPurchased(course.id);
      },
    });
    rzp.on("payment.failed", (payload: unknown) => {
      const description = (payload as { error?: { description?: string } })?.error?.description;
      setState({
        stage: "failed",
        order,
        message: description
          ? `Payment failed: ${description}`
          : "The payment failed at the provider. No access was granted.",
        retry: "gateway",
      });
    });
    rzp.open();
  };

  const retryFromFailed = () => {
    if (state.stage !== "failed") return;
    if (state.retry === "order") {
      void createOrder();
      return;
    }
    if (state.retry === "verify" && state.order) {
      setState({ stage: "checkout_open", order: state.order });
      return;
    }
    if (state.order) setState({ stage: "checkout_open", order: state.order });
  };

  const cancel = () => {
    if (busy) return;
    setState({ stage: "cancelled", order: state.stage === "checkout_open" ? state.order : undefined });
  };

  const close = () => {
    if (state.stage === "checkout_open") {
      setState({ stage: "cancelled", order: state.order });
      return;
    }
    if (busy) return;
    onClose();
  };

  const stepLabel =
    state.stage === "email" || state.stage === "sending_code"
      ? "1 · Your email"
      : state.stage === "code" || state.stage === "verifying_code"
        ? "2 · Verify email"
        : "3 · Payment";

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/60" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-2 border-ink bg-cream shadow-hard sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-white px-5 py-3.5">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Lock className="size-4 text-moss" aria-hidden="true" />
              Secure checkout
            </p>
            <p className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-smoke uppercase">
              {stepLabel}
            </p>
          </div>
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
          {/* Course context — always visible */}
          <div className="mb-4 rounded-2xl border-2 border-ink bg-white p-3.5">
            <p className="text-[10px] font-bold tracking-[0.18em] text-smoke uppercase">You’re buying</p>
            <p className="mt-1 text-sm font-bold text-ink">{course.title}</p>
            <p className="text-xs text-smoke">
              by {course.creator.displayName} ·{" "}
              <span className="font-bold text-ink tabular-nums">
                {isFree ? "FREE" : formatINR(course.priceInPaise)}
              </span>
            </p>
          </div>

          {(state.stage === "email" || state.stage === "sending_code") && (
            <div>
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
                  <MailCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink">Your email</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-smoke">
                    We’ll email you a 6-digit code.
                  </p>
                </div>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setEmailTouched(true);
                  void sendCode();
                }}
              >
                <Field
                  id="checkout-email"
                  label="Email"
                  error={emailTouched ? (formError ?? undefined) : undefined}
                >
                  <Input
                    id="checkout-email"
                    type="email"
                    inputMode="email"
                    value={email}
                    autoComplete="email"
                    placeholder="you@example.com"
                    invalid={emailTouched && Boolean(formError)}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setFormError(null);
                    }}
                  />
                </Field>
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="mt-4 w-full"
                  loading={state.stage === "sending_code"}
                  disabled={state.stage === "sending_code"}
                >
                  Send my code
                </Button>
              </form>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-smoke">
                Your learner account is created for this email at payment.
              </p>
            </div>
          )}

          {(state.stage === "code" || state.stage === "verifying_code") && (
            <div>
              <div className="mb-4 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
                  <MailCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink">Check your inbox</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-smoke">
                    We sent a 6-digit code to <span className="font-bold text-ink">{email}</span>.
                  </p>
                </div>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void confirmCode();
                }}
              >
                <Field id="checkout-code" label="6-digit code" error={formError ?? undefined}>
                  <Input
                    id="checkout-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    placeholder="000000"
                    invalid={Boolean(formError)}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/[^0-9]/g, ""));
                      setFormError(null);
                    }}
                    className="tracking-[0.5em] tabular-nums"
                  />
                </Field>
                {state.stage === "code" && state.previewCode ? (
                  <p className="mt-2 rounded-xl border-2 border-dashed border-ink/40 bg-parchment/70 p-3 text-[11px] leading-relaxed text-smoke">
                    <span className="font-bold text-ink">Email delivery isn’t configured here.</span>{" "}
                    Your code is{" "}
                    <span className="font-mono text-sm font-bold tracking-[0.2em] text-ink">
                      {state.previewCode}
                    </span>
                    . Add RESEND_API_KEY to send these by email.
                  </p>
                ) : null}
                {resendNotice ? (
                  <p className="mt-2 text-[11px] font-semibold text-moss">{resendNotice}</p>
                ) : null}
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="mt-4 w-full"
                  loading={state.stage === "verifying_code"}
                  disabled={state.stage === "verifying_code"}
                >
                  Verify and continue
                </Button>
              </form>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setState({ stage: "email" });
                    setCode("");
                    setFormError(null);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-smoke underline underline-offset-2"
                >
                  <ArrowLeft className="size-3" aria-hidden="true" /> Change email
                </button>
                <button
                  type="button"
                  onClick={() => void sendCode(true)}
                  className="text-[11px] font-bold text-accent underline underline-offset-2"
                >
                  Resend code
                </button>
              </div>
            </div>
          )}

          {(state.stage === "ready" || state.stage === "creating_order") && (
            <div className="space-y-3">
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
                  <div className="rounded-2xl border-2 border-ink bg-white p-4">
                    <p className="flex items-center gap-2 text-xs font-bold text-ink">
                      <BadgeCheck className="size-4 text-moss" aria-hidden="true" />
                      Email verified
                    </p>
                    <p className="mt-1 text-xs text-smoke">{email}</p>
                  </div>

                  {!isFree && readiness && !readiness.ready ? (
                    <div className="rounded-2xl border-2 border-accent-deep bg-accent/5 p-4 text-left">
                      <p className="flex items-center gap-2 text-sm font-bold text-accent-deep">
                        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                        Paid checkout isn’t available yet
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

                  {isFree ? (
                    <>
                      <div className="rounded-2xl border-2 border-ink bg-lime p-4">
                        <p className="text-lg font-bold text-ink">Free course</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink/80">
                          No payment needed — added to your library instantly.
                        </p>
                      </div>
                      <Button
                        variant="ink"
                        size="lg"
                        className="w-full"
                        onClick={() => void createOrder()}
                        loading={state.stage === "creating_order"}
                      >
                        Enrol free
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="accent"
                        size="lg"
                        className="w-full"
                        onClick={() => void createOrder()}
                        loading={state.stage === "creating_order"}
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
                </>
              )}
            </div>
          )}

          {state.stage === "checkout_open" && (
            <div>
              <div className="rounded-2xl border-2 border-ink bg-ink p-4 text-cream">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">
                    Razorpay {state.order.keyId.startsWith("rzp_test_") ? "· test keys" : ""}
                  </p>
                  <ShieldCheck className="size-4.5 text-lime" aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums">
                  {formatINR(state.order.amountInPaise)}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-cream/50">{state.order.orderId}</p>
                <p className="mt-2 text-[11px] text-cream/60">
                  Pay by UPI, card, net-banking, or wallet in the secure Razorpay window. Access is
                  granted only after the server verifies the payment signature.
                </p>
              </div>
              <Button variant="accent" size="lg" className="mt-4 w-full" onClick={() => void launchRazorpay()}>
                <CreditCard className="size-4" aria-hidden="true" />
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
          )}

          {state.stage === "processing" ? (
            <StatePanel
              icon={<Loader2 className="size-6 animate-spin" aria-hidden="true" />}
              title="Confirming payment"
              body="Waiting for the payment provider to confirm and the server to verify."
            />
          ) : null}

          {state.stage === "success" ? (
            <div className="py-2 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-hard-xs">
                <BadgeCheck className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">You’re in!</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-smoke">
                {state.order.courseTitle} is now in your library.
              </p>
              <p className="mt-2 font-mono text-[10px] text-smoke">
                {state.receipt.amountInPaise > 0 ? state.receipt.paymentId : state.receipt.orderId}
              </p>
              <AccountDelivery account={state.receipt.account} fallbackEmail={email} />
              <div className="mt-5 space-y-2.5">
                <Button
                  href="/learn/courses"
                  variant="ink"
                  size="lg"
                  className="w-full"
                  onClick={() => onPurchased(course.id)}
                >
                  Start learning
                </Button>
                <Button
                  href="/learn/purchases"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onPurchased(course.id)}
                >
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
              <h3 className="mt-4 text-xl font-bold text-ink">Payment not completed</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-smoke">{state.message}</p>
              <div className="mt-5 space-y-2.5">
                <Button variant="accent" className="w-full" onClick={retryFromFailed}>
                  Try again
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
                No payment was taken. Your course is waiting whenever you are.
              </p>
              <div className="mt-5 space-y-2.5">
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() =>
                    setState(
                      state.order ? { stage: "checkout_open", order: state.order } : { stage: "ready" },
                    )
                  }
                >
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
            Secure payments by Razorpay · Non-refundable
          </p>
        </div>
      </div>
    </div>
  );
}

function AccountDelivery({
  account,
  fallbackEmail,
}: {
  account: CheckoutAccountInfo | undefined;
  fallbackEmail: string;
}) {
  const email = account?.email ?? fallbackEmail;
  if (!account) {
    return (
      <p className="mx-auto mt-3 max-w-xs text-[11px] leading-relaxed text-smoke">
        Your receipt and dashboard access were sent to {email}.
      </p>
    );
  }
  return (
    <div className="mx-auto mt-3 max-w-xs rounded-2xl border-2 border-ink bg-white p-3 text-left">
      <p className="text-[11px] font-bold text-ink">Your learner dashboard</p>
      <p className="mt-1 text-[11px] leading-relaxed text-smoke">
        {account.created
          ? account.emailed
            ? `Login details were emailed to ${email}.`
            : `Your account is ready for ${email}.`
          : `This course was added to your existing account (${email}).`}
      </p>
      {account.password ? (
        <p className="mt-2 rounded-xl bg-parchment/70 p-2 font-mono text-[11px] leading-relaxed text-ink">
          Email: {email}
          <br />
          Password: {account.password}
          <span className="mt-1 block font-sans text-[10px] text-smoke">
            Save this password now — we couldn’t confirm the email delivery.
          </span>
        </p>
      ) : null}
    </div>
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
