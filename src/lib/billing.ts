"use client";

/**
 * Razorpay Checkout (checkout.js) helper — loaded on demand so the script
 * only ships when real payments are configured.
 */

interface RazorpayVerifyResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export function ensureRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  description: string;
  email?: string;
  name?: string;
  onSuccess: (resp: RazorpayVerifyResponse) => void | Promise<void>;
  onDismiss?: () => void;
}): Promise<void> {
  const loaded = await ensureRazorpayScript();
  if (!loaded || !window.Razorpay) throw new Error("Could not load the payment gateway — check your connection");

  const rzp = new window.Razorpay({
    key: opts.keyId,
    amount: opts.amountPaise,
    currency: "INR",
    name: "Beevo",
    description: opts.description,
    order_id: opts.orderId,
    prefill: { email: opts.email ?? "", name: opts.name ?? "" },
    theme: { color: "#f5a301", backdrop_color: "rgba(16,11,6,0.6)" },
    modal: { ondismiss: () => opts.onDismiss?.() },
    handler: (response: RazorpayVerifyResponse) => {
      void opts.onSuccess(response);
    },
  });
  rzp.open();
}
