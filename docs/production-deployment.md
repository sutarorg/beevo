# Beevo Production Deployment Runbook (Vercel + Supabase + Railway + R2)

## 1. Supabase Setup (Database & Auth)

1. Create a production Supabase project in **Mumbai (`ap-south-1`)** for low latency to Indian creators and Razorpay.
2. Apply migrations in exact order using the Supabase CLI or SQL Editor:
   ```bash
   supabase db push
   # Applies:
   # 1. supabase/migrations/202611150001_beevo_core_schema.sql
   # 2. supabase/migrations/202611150002_beevo_rls_and_functions.sql
   ```
3. Configure Auth URLs in Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `https://beevo.app` (your production domain)
   - Redirect URLs: `https://beevo.app/api/auth/callback`
4. Promote your first Super Admin after signing up:
   ```sql
   UPDATE public.user_roles SET role = 'super_admin'
   WHERE user_id = '<YOUR_AUTH_USER_UUID>';
   ```

## 2. Cloudflare R2 Private Bucket

1. Create a private R2 bucket (e.g., `beevo-private-media`) with **Public Access DISABLED**.
2. Create an R2 API Token with Object Read & Write permissions scoped exclusively to that bucket.
3. Configure CORS on the bucket only if direct browser playback requires `GET`/`HEAD` from `https://beevo.app`.

## 3. Vercel Web & API Deployment

1. Connect the GitHub repository to Vercel (Framework Preset: **Next.js**; Root Directory: `.`; `vercel.json` is pre-configured).
2. Set all required environment variables from `.env.example` in Vercel Project Settings (Production & Preview).
3. Verify live deployment health:
   ```bash
   curl -s https://beevo.app/api/health
   ```

## 4. Railway Dedicated FFmpeg Worker Deployment

1. Create a Railway service pointing to the same repository; Railway automatically detects `railway.toml` and builds `worker/Dockerfile` (Node 22 + FFmpeg + Noto / Devanagari fonts).
2. Add the same server-side environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, `ELEVENLABS_API_KEY`, `R2_*`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `WORKER_POLL_INTERVAL_MS`, `WORKER_LEASE_SECONDS`).
3. Verify Railway health probe returns `200 OK` on `GET /health`.

## 5. External Webhooks & Transactional Email

1. **Razorpay Dashboard → Webhooks:** Add `https://beevo.app/api/webhooks/razorpay` with events `payment.captured`, `payment.failed`, `refund.processed` and copy the signing secret to `RAZORPAY_WEBHOOK_SECRET`.
2. **Resend Dashboard:** Verify your sending domain (DKIM + SPF + DMARC) and set `RESEND_FROM_EMAIL` and `RESEND_API_KEY`.
