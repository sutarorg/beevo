# Beevo Double-Entry Credit Ledger & Atomic Wallet Architecture

**Implementation:** `supabase/migrations/202611150002_beevo_rls_and_functions.sql` & `src/features/credits/service.ts`

## 1. Canonical Credit Pricing Formula (Server-Authoritative)

```text
required_credits = ceil(duration_seconds / 15) * 25
  • Minimum duration: 15s (25 credits)
  • Maximum duration: 600s / 10 minutes (1,000 credits)
  • Rate: 100 credits per minute (25 credits per 15-second step)
```

- **Credit Packs (One-Time Purchases — No Subscriptions):**
  - **Starter:** ₹299 (`29900` paise) → **300 credits** (~3 min)
  - **Creator:** ₹599 (`59900` paise) → **800 credits** (~8 min)
  - **Studio:** ₹899 (`89900` paise) → **1,500 credits** (~15 min)
- Client-submitted credit amounts are **never** trusted; every server route computes `calculateRequiredCreditsServer(durationSeconds)` independently.

## 2. Reservation → Consumption → Automatic Refund Lifecycle

| Lifecycle Event | PL/pgSQL RPC | Ledger Entry Type | Wallet Effect |
|---|---|---|---|
| Verified Razorpay Purchase | `allocate_purchase_credits` | `purchase_credit` | `available += credits`, `lifetime_purchased += credits` |
| Generation Queued | `reserve_generation_credits` | `generation_reserve` | `available -= credits`, `reserved += credits` |
| FFprobe-Verified Video Completed | `consume_generation_credits` | `generation_consume` | `reserved -= credits`, `lifetime_consumed += credits` |
| Failure or User Cancellation | `release_generation_credits` | `generation_release_refund` | `reserved -= credits`, `available += credits` |
| Admin Manual Adjustment | `admin_adjust_credits` | `admin_credit` / `admin_debit` | `available +/-= credits` + mandatory `audit_logs` record |

Every RPC acquires a row lock (`SELECT ... FOR UPDATE`) on `credit_wallets` and deduplicates by unique `idempotency_key`, making double-credits, double-debits, or negative balances mathematically impossible even under concurrent requests or webhook retries.
