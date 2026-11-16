# Beevo Database Schema & RLS Specification

## 1. Migrations

| Migration File | Purpose |
|---|---|
| `supabase/migrations/202611150001_beevo_core_schema.sql` | Creates all 26 PostgreSQL tables, constraints, composite indexes, canonical credit packages (`starter`, `creator`, `studio`), and runtime `system_configuration` defaults. |
| `supabase/migrations/202611150002_beevo_rls_and_functions.sql` | Creates append-only immutability triggers (`credit_ledger`, `audit_logs`), `calculate_required_credits`, `is_admin`, `handle_new_user`, atomic credit RPCs, `claim_next_generation_job` (`FOR UPDATE SKIP LOCKED`), `REVOKE ALL FROM PUBLIC`, and strict RLS policies on every table. |

## 2. Core Tables (26 Tables)

1. **Identity & Access:** `profiles`, `user_roles`
2. **Credits & Billing:** `credit_wallets`, `credit_ledger` (append-only), `credit_packages`, `payments`
3. **Projects & Storyboarding:** `projects`, `project_settings`, `characters`, `storyboards`, `scenes` (dynamic N scenes per storyboard), `assets`, `scene_assets`
4. **Audio, Timeline & Execution:** `voice_generations`, `timelines`, `generations`, `generation_events`, `render_jobs`, `generation_jobs`
5. **Operations & Governance:** `webhook_events`, `email_outbox`, `music_library`, `provider_usage`, `audit_logs` (append-only), `notifications`, `system_configuration`

## 3. Financial Integrity & Concurrency Guarantees

- **Integer Currency:** All INR amounts (`price_paise`, `amount_paise`, `refunded_paise`, `razorpay_fee_paise`, `razorpay_tax_paise`) are stored as exact integer paise (`₹299 = 29900`).
- **Append-Only Ledger:** `trg_credit_ledger_immutable` and `trg_audit_logs_immutable` raise exceptions on any `UPDATE` or `DELETE`.
- **Row-Level Locking:** `allocate_purchase_credits`, `reserve_generation_credits`, `consume_generation_credits`, `release_generation_credits`, and `admin_adjust_credits` lock the user's `credit_wallets` row via `SELECT ... FOR UPDATE` and enforce unique `idempotency_key` deduplication.
- **No Client Wallet Writes:** Authenticated users have `SELECT`-only access on `credit_wallets` and `credit_ledger`; every mutation runs exclusively through `SECURITY DEFINER` RPCs revoked from `PUBLIC`, `anon`, and `authenticated`.

## 4. Database-Backed Job Queue

`public.claim_next_generation_job(p_worker_id TEXT, p_lease_seconds INTEGER)` atomically:
1. Reclaims stale `running` jobs whose `lease_expires_at < NOW()` (re-queueing or moving to `dead_letter` once `attempt_count >= max_attempts`).
2. Selects the highest-priority eligible `queued` job using `FOR UPDATE SKIP LOCKED`.
3. Marks it `running`, assigns `worker_id`, extends `lease_expires_at`, and increments `attempt_count`.
