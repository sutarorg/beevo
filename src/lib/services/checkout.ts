import type { ApiResult } from "@/lib/domain";
import type { CheckoutOrder, PaymentReceipt } from "@/lib/learner-types";
import { get as apiGet, post as apiPost } from "@/lib/services/api";
import { invalidateSessionCache } from "@/lib/services/auth";

/**
 * Checkout service contract.
 *
 * 1. `startEmailVerification` emails a one-time code to the buyer.
 * 2. `confirmEmailVerification` returns a short-lived verification token.
 * 3. `createOrder` provisions/reuses the learner account, opens a real
 *    Razorpay order (or enrols instantly for a free course), and signs the
 *    buyer in.
 * 4. `verifyPayment` asks the server to verify the Razorpay signature. Access
 *    is granted only after that verification succeeds.
 */

export type PaymentOutcome = "success" | "failed";
export type PendingResolution = "success";

export interface CheckoutReadiness {
  ready: boolean;
  code: string;
  message: string;
  mode: "test" | "live" | "unconfigured";
}

export interface EmailVerificationStart {
  sent: true;
  email: string;
  expiresAt: string;
  delivery: "email" | "preview";
  /** Development only, when no mail provider is configured. */
  previewCode?: string;
}

export interface EmailVerificationResult {
  verified: true;
  email: string;
  verificationToken: string;
  expiresAt: string;
}

export interface CheckoutService {
  getStatus(): Promise<ApiResult<CheckoutReadiness>>;
  startEmailVerification(email: string): Promise<ApiResult<EmailVerificationStart>>;
  confirmEmailVerification(email: string, code: string): Promise<ApiResult<EmailVerificationResult>>;
  createOrder(input: {
    courseId: string;
    email: string;
    verificationToken: string;
  }): Promise<ApiResult<CheckoutOrder>>;
  verifyPayment(params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<ApiResult<PaymentReceipt & { enrolled: boolean }>>;
}

class ApiCheckoutService implements CheckoutService {
  getStatus() {
    return apiGet<CheckoutReadiness>("checkout/status");
  }
  startEmailVerification(email: string) {
    return apiPost<EmailVerificationStart>("checkout/verification/start", { email });
  }
  confirmEmailVerification(email: string, code: string) {
    return apiPost<EmailVerificationResult>("checkout/verification/confirm", { email, code });
  }
  async createOrder(input: { courseId: string; email: string; verificationToken: string }) {
    const result = await apiPost<CheckoutOrder>("checkout", input);
    // Checkout signs the buyer in; shells must see the fresh session.
    if (result.ok || (!result.ok && result.error.code === "already_enrolled")) invalidateSessionCache();
    return result;
  }
  verifyPayment(params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    return apiPost<PaymentReceipt & { enrolled: boolean }>("checkout/verify", params);
  }
}

const apiCheckoutService = new ApiCheckoutService();

export function getCheckoutService(): CheckoutService | null {
  return apiCheckoutService;
}
