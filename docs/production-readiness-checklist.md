# Beevo Production Readiness Checklist

## 1. Automated Verification Completed in This Workspace

- [x] **Unit & Integration Test Suite (`npm test`):** 9/9 test files, **33/33 tests passing** covering credit formula, provider pricing, Razorpay/fal HMAC verification, dynamic storyboard validation, fal.ai image-only policy guardrails, ElevenLabs chunking + Hindi/English alignment, ASS/SRT caption & timeline generation, FFmpeg filtergraph & R2 path/MIME security, RLS/SQL migration hardening, and strict zero-mock API responses.
- [x] **TypeScript (`npm run typecheck`):** 0 errors across `src/`, `worker/`, and `tests/`.
- [x] **ESLint (`npm run lint`):** 0 warnings, 0 errors.
- [x] **Production Build (`npm run build`):** Compiled cleanly — all 47 pages, 46 API routes, and Next.js SSR middleware.
- [x] **Live HTTP Security & Zero-Mock Audit:** Verified live `GET /api/health`, `GET /api/packages`, `GET /api/voices` (`503`), `GET /api/me` (`503`), `GET /api/admin/overview` (`503`), `POST /api/webhooks/razorpay` (`503`), and security response headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-store`).
- [x] **Post-Integration Multi-Device Playwright Visual QA:** **40/40 checks passed** across Marketing (`/` & `/pricing`), Auth (`/login` & `/signup`), Studio (`/app`, `/app/create`, `/app/credits`), and Admin (`/admin`, `/admin/ai-costs`, `/admin/configuration`) at `320px`, `390px`, `768px`, and `1440px` with `0px` horizontal overflow, `0` broken images, `0` console errors, `0` page errors, plus verified live `/login` → `/api/auth/login` 503 error state.

## 2. Live Credentials & Infrastructure Verification Required by Operator Before Public Launch

The following items require real production provider accounts and credentials (not present in this sandbox):
- [ ] Apply both SQL migrations to production Supabase PostgreSQL and verify RLS policies via an authenticated non-admin JWT.
- [ ] Populate all secrets from `.env.example` into Vercel and Railway and confirm `GET /api/health` reports `true` across all 8 integration flags and `databaseReachable: true`.
- [ ] Execute a live ₹299 Razorpay test-mode purchase end-to-end (Checkout + Webhook) and verify exactly +300 credits in `credit_ledger`.
- [ ] Run a 1-minute English + 1-minute Hindi end-to-end generation on the Railway Docker worker and inspect the resulting private R2 MP4 video, lip-free cartoon visual continuity, audio ducking, and burned-in captions.
- [ ] Test an admin credit adjustment and payment refund on `/admin` and verify entries in `/admin/audit-logs`.
- [ ] Configure uptime monitoring on `https://beevo.app/api/health` and the Railway worker `/health` endpoint.
