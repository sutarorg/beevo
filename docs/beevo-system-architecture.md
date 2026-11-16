# Beevo System Architecture (Phase 4)

## 1. End-to-End Platform Topology

Beevo is architected as a modular, production-ready AI Cartoon Video Creation SaaS with strict separation between the web/API layer (Vercel + Next.js App Router) and the dedicated long-running media pipeline & FFmpeg rendering service (Railway Docker container).

```text
Browser (Marketing / Studio / Admin)
   │
   ├── HTTPS (Next.js App Router on Vercel)
   │     ├── src/middleware.ts (Supabase SSR cookie refresh + route guards)
   │     ├── Public / Auth / User / Project / Storyboard / Credits / Payments / Admin API Routes
   │     ├── SSE Live Stream (/api/generations/[id]/events)
   │     └── Signed Webhooks (/api/webhooks/razorpay, /api/webhooks/fal)
   │
   ├── Supabase PostgreSQL + Supabase Auth
   │     ├── 26 relational tables + strict RLS policies
   │     ├── Append-only credit_ledger & audit_logs triggers
   │     ├── Atomic PL/pgSQL credit RPCs (allocate, reserve, consume, release, admin_adjust)
   │     └── Database-backed job queue (generation_jobs + FOR UPDATE SKIP LOCKED)
   │
   ├── Dedicated Railway Docker Worker (worker/Dockerfile + worker/index.ts)
   │     ├── HTTP /health probe on 0.0.0.0:${PORT:-8080}
   │     ├── Poll loop claiming generation_jobs with 5-min leases + 60s heartbeat renewal
   │     ├── Stage 1 & 2: fal.ai FLUX 3 Klein (image-only) + Sharp validation → Private R2
   │     ├── Stage 3: ElevenLabs TTS /with-timestamps (sentence chunking + rebasing) → Private R2
   │     ├── Stage 4: Beevo Custom Audio Alignment + ASS/SRT Captions + Dynamic Timeline JSON
   │     ├── Stage 5: Two-pass chunked FFmpeg HD Render + ffprobe validation → Private R2
   │     └── Resend transactional email_outbox retry sweeper
   │
   └── External Providers (Zero video-generation APIs, zero Inngest/Redis/K8s bloat)
         ├── OpenAI Responses API + Structured Outputs (Script, Style Bible, Characters, Dynamic Storyboard)
         ├── fal.ai Image Models ONLY (blackforestlabs/flux-3/klein/text-to-image & edit-image)
         ├── ElevenLabs TTS (/v1/text-to-speech/{voice_id}/with-timestamps + live /v1/voices)
         ├── Cloudflare R2 (Private bucket, presigned expiring URLs only, $0 egress)
         ├── Razorpay (One-time Orders, HMAC Checkout + raw-body Webhook verification, Refunds)
         └── Resend (Transactional emails + PostgreSQL email_outbox)
```

## 2. Why This Stack Fits Beevo

- **No Serverless Timeouts:** All heavy multi-minute scene generation, TTS stitching, and 1080p FFmpeg rendering execute on the persistent Railway Docker worker (`worker/`), completely decoupled from Vercel function time limits and independent of the user's browser staying open.
- **No Unnecessary Infrastructure Sprawl:** PostgreSQL's `FOR UPDATE SKIP LOCKED` handles durable background job queueing, lease heartbeats, crash recovery, and dead-lettering without introducing Redis, Inngest, RabbitMQ, or Kubernetes.
- **Dynamic Visual Storytelling:** Scene count and visual beat count are determined dynamically by narrative structure and real audio timestamps—never fixed per minute.
- **Strict Zero-Mock Behavior:** Every API endpoint fails closed (`401`/`403`/`503 SERVICE_UNAVAILABLE`) when credentials are unconfigured rather than returning synthetic accounts, balances, voices, or metrics.
