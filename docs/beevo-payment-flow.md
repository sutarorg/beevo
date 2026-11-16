# Beevo Razorpay One-Time Payment & Webhook Security Flow

**Implementation:** `src/lib/razorpay/client.ts`, `src/features/payments/service.ts`, `src/app/api/payments/{create-order,verify}/route.ts`, `src/app/api/webhooks/razorpay/route.ts`

## 1. End-to-End One-Time Purchase Flow

1. **Order Creation (`POST /api/payments/create-order`):**
   - Authenticated user sends `{ packageCode }` (`starter` | `creator` | `studio`).
   - Server fetches authoritative `price_paise` and `credits_amount` from `credit_packages`—client never passes price or credit amounts.
   - Server creates a Razorpay Order (`currency: "INR"`, integer `amount` in paise) and inserts a `payments` row with `status = 'created'`.
2. **Checkout Verification (`POST /api/payments/verify`):**
   - Server loads the stored `payments` record belonging to `auth.userId`.
   - Verifies `HMAC-SHA256(stored_razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)` using timing-safe comparison (`crypto.timingSafeEqual`)—never trusting an unverified client-supplied `order_id`.
   - Fetches the live payment directly from Razorpay's API (`GET /v1/payments/{id}`) to confirm `status === "captured"`, `order_id` matches, `currency === "INR"`, and `amount === stored.amount_paise`.
   - Calls `allocate_purchase_credits` with idempotency key `razorpay_purchase:{razorpay_payment_id}`—guaranteeing credits are granted **at most once**.
   - Updates `payments.status = 'captured'`, records Razorpay fee/tax paise, creates an in-app notification, and queues a Resend payment receipt email.
3. **Authoritative Async Webhook (`POST /api/webhooks/razorpay`):**
   - Reads raw untouched HTTP body (`await request.text()`).
   - Verifies `x-razorpay-signature` via `HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)` with `crypto.timingSafeEqual`.
   - Inserts `x-razorpay-event-id` into `webhook_events` (unique constraint handles duplicate deliveries safely).
   - Processes `payment.captured` (reconciling payments if the user closed their browser mid-checkout), `payment.failed`, and `refund.processed`.
4. **Admin Refunds (`POST /api/admin/payments/[id]/refund`):**
   - Requires verified `admin`/`super_admin`, calls Razorpay Refund API, reverses credits if wallet balance permits (flagging partial/manual review when already spent), updates `payments`, and writes an immutable `audit_logs` record.
