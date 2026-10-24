import { USE_MOCK_SERVICES } from "@/lib/config";
import type { ApiResult } from "@/lib/domain";
import type { CheckoutOrder, PaymentReceipt } from "@/lib/learner-types";
import { readMockCourses } from "@/lib/services/courses";
import { consumeForcedFailure, mockId, mockLatency } from "@/lib/services/mock-utils";

/**
 * Checkout service contract — the frontend payment state machine's backend.
 *
 * Prompt 5 implements this against Razorpay (see API_CONTRACTS §4):
 *  - createOrder → server creates order + Razorpay order id, returns
 *    { orderId, amountInPaise, currency, keyId } for Checkout.js;
 *  - the driver's callbacks map to gateway events (dismiss, failed, captured);
 *  - settlePayment → signature verification + enrolment + receipt email.
 *
 * THIS MOCK PROCESSES NO MONEY. It returns simulated orders/receipts with
 * `gateway: "razorpay-simulated"` and an explicit note on every receipt.
 */

export type PaymentOutcome = "success" | "failed";
export type PendingResolution = "success";

/**
 * Whether this deployment can actually take a payment. The server derives it
 * from provider configuration only (never from the presence of a browser
 * key), so the UI can explain a disabled gateway before the buyer tries.
 */
export interface CheckoutReadiness {
  ready: boolean;
  code: string;
  message: string;
  mode: "test" | "live" | "unconfigured";
}

export interface CheckoutService {
  /** Non-secret readiness probe (provider config + approval gates). */
  getStatus(): Promise<ApiResult<CheckoutReadiness>>;
  createOrder(courseId: string): Promise<ApiResult<CheckoutOrder>>;
  /** Simulated gateway settlement (mock adapter only). */
  settlePayment(orderId: string, outcome: PaymentOutcome): Promise<ApiResult<PaymentReceipt>>;
  /** Poll a bank-pending payment (mock adapter only). */
  confirmPendingPayment(orderId: string): Promise<ApiResult<PaymentReceipt>>;
  /** Server-side verification of a completed Razorpay checkout (live flow). */
  verifyPayment(params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<ApiResult<PaymentReceipt & { enrolled: boolean }>>;
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function err<T>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

class MockCheckoutService implements CheckoutService {
  private orders = new Map<string, CheckoutOrder>();

  async getStatus(): Promise<ApiResult<CheckoutReadiness>> {
    return ok({
      ready: true,
      code: "ready",
      message: "Demo gateway — every outcome is simulated and no money can move.",
      mode: "test",
    });
  }

  async createOrder(courseId: string): Promise<ApiResult<CheckoutOrder>> {
    await mockLatency(500, 350);
    const forced = consumeForcedFailure<CheckoutOrder>();
    if (forced) return forced;
    const course = readMockCourses().find(
      (item) => item.id === courseId && item.status === "published",
    );
    if (!course || course.priceInPaise === null) {
      return err("not_purchasable", "This course isn't available for purchase right now.");
    }
    const order: CheckoutOrder = {
      orderId: mockId("ord_demo"),
      courseId: course.id,
      courseTitle: course.title,
      amountInPaise: course.priceInPaise,
      platformFeeInPaise: Math.round(course.priceInPaise * 0.08),
      currency: "INR",
      gateway: "razorpay-simulated",
      keyId: "rzp_test_DEMO_NOT_A_REAL_KEY",
    };
    this.orders.set(order.orderId, order);
    return ok(order);
  }

  async settlePayment(orderId: string, outcome: PaymentOutcome): Promise<ApiResult<PaymentReceipt>> {
    await mockLatency(1100, 600);
    const forced = consumeForcedFailure<PaymentReceipt>();
    if (forced) return forced;
    const order = this.orders.get(orderId);
    if (!order) return err("order_not_found", "This order expired — start checkout again.");
    if (outcome === "failed") {
      return err(
        "payment_failed",
        "Your payment was declined (simulated gateway response). No money moved — try another method.",
      );
    }
    return ok({
      paymentId: mockId("pay_demo"),
      orderId,
      amountInPaise: order.amountInPaise,
      note: "Simulated payment — no money was charged and no Razorpay transaction exists.",
    });
  }

  async confirmPendingPayment(orderId: string): Promise<ApiResult<PaymentReceipt>> {
    await mockLatency(2200, 800);
    const order = this.orders.get(orderId);
    if (!order) return err("order_not_found", "This order expired — start checkout again.");
    return ok({
      paymentId: mockId("pay_demo"),
      orderId,
      amountInPaise: order.amountInPaise,
      note: "Simulated payment — pending bank confirmation resolved (demo). No money moved.",
    });
  }

  async verifyPayment(): Promise<ApiResult<PaymentReceipt & { enrolled: boolean }>> {
    return err("not_applicable", "Mock mode simulates payments without server verification.");
  }
}

// ---------------------------------------------------------------------------
// Live adapter — real Razorpay order creation + server signature verification
// ---------------------------------------------------------------------------

import { get as apiGet, post as apiPost } from "@/lib/services/api";

class ApiCheckoutService implements CheckoutService {
  getStatus() {
    return apiGet<CheckoutReadiness>("checkout/status");
  }
  createOrder(courseId: string) {
    return apiPost<CheckoutOrder>("checkout", { courseId });
  }
  async settlePayment(): Promise<ApiResult<PaymentReceipt>> {
    return err("not_applicable", "Live mode pays through the real Razorpay checkout.");
  }
  async confirmPendingPayment(): Promise<ApiResult<PaymentReceipt>> {
    return err("not_applicable", "Live pending states are resolved by the provider webhook.");
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
const mockCheckoutService = new MockCheckoutService();

export function getCheckoutService(): CheckoutService | null {
  if (USE_MOCK_SERVICES) return mockCheckoutService;
  return apiCheckoutService;
}
