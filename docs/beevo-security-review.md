# Beevo Security Review & Threat Mitigation Matrix

## 1. Threat Controls Implemented in Phase 4

| Security Domain | Threat Mitigated | Implemented Control |
|---|---|---|
| **Authentication & Session** | Unauthorized access, stale sessions, open redirect | Supabase SSR HTTP-only cookies refreshed in `src/middleware.ts`; `/app/*` & `/admin/*` fail closed to `/login`; `/api/auth/callback` restricts redirects to internal relative paths (`/`). |
| **RBAC & Admin Isolation** | Privilege escalation from user to admin | `requireAdmin()` verifies both Supabase session and `user_roles` (`admin`/`super_admin`) plus `profiles.account_status = 'active'` on every `/api/admin/*` route; every admin mutation writes to append-only `audit_logs`. |
| **Database Row-Level Security** | Cross-tenant IDOR & direct wallet tampering | RLS enabled on all 26 PostgreSQL tables; `credit_wallets` and `credit_ledger` are `SELECT`-only for users; financial RPCs (`SECURITY DEFINER`) are `REVOKE ALL FROM PUBLIC, anon, authenticated`. |
| **Payments & Webhooks** | Amount tampering, spoofed orders, webhook replay | Razorpay order price read server-side from `credit_packages`; checkout HMAC computed over server-stored `razorpay_order_id` + live Razorpay capture check; webhook HMAC computed over exact raw bytes (`crypto.timingSafeEqual`) + `webhook_events` unique event ID deduplication. |
| **AI Policy Guardrail** | Accidental or malicious fal.ai video API invocation | `assertFalImageOnlyModel()` hard-blocks all video endpoints (`POLICY_VIOLATION`) and permits only verified fal.ai image-generation models. |
| **Media & Storage Security** | Public asset leaks, path traversal, spoofed MIME types | Private Cloudflare R2 bucket only; `buildProjectR2Key()` sanitizes path segments against `..`; `validateR2Upload()` enforces strict MIME & byte ceilings; Sharp validates generated images; media served exclusively via short-lived presigned URLs after ownership checks. |
| **Rate Limiting & Validation** | Brute-force login, generation spam, malformed payloads | Sliding-window rate limiting (`src/lib/security/rate-limit.ts`) on auth, generation, payment, and webhook routes; strict Zod schemas (`src/lib/validation/schemas.ts`) on all write endpoints. |
| **HTTP Headers & Secrets** | MIME sniffing, referrer leak, secret exposure | `next.config.ts` sets `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`; API routes set `Cache-Control: no-store`; `/api/health` exposes booleans only, never keys. |
