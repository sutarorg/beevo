# 🐝 Beevo — Social Media Planner

Production-ready SaaS for scheduling & publishing to **Instagram, Facebook, Twitter/X, LinkedIn, Pinterest and YouTube** — with real authentication, OAuth connections, a background scheduling engine, analytics, team workspaces, Razorpay (INR) billing, email notifications and media uploads.

---

## 1. Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion, Recharts |
| Backend | Next.js route handlers (`/api/*`), Drizzle ORM |
| Database | PostgreSQL (Vercel Postgres / Neon / any pg) |
| Auth | bcrypt password hashing + opaque DB session tokens in httpOnly cookies |
| Payments | Razorpay Orders API (INR) + webhook signature verification |
| Email | Resend **or** any SMTP server (nodemailer) |
| Uploads | Vercel Blob (or local disk when self-hosting) |
| Scheduler | DB-driven publisher — Vercel Cron (daily backstop) + free 5-min pinger (GitHub Action), or internal loop when self-hosted |

Every external dependency is **optional at boot**: without keys the app runs in clearly-labelled demo modes (simulated connections, demo billing, local uploads). Set the keys and the same code paths go live.

---

## 2. Quick start (local)

```bash
cp .env.example .env          # then fill values (section 4)
npm install
npx drizzle-kit push          # create tables in your Postgres
npm run build && npm start    # or: npm run dev
```

Open http://localhost:3000 → **Sign up** (email or **Continue with Google**). Set `DEMO_SEED=true` if you want new workspaces pre-filled with sample content for demos.

Demo conveniences are **off by default** — enable explicitly per-environment:

| Flag | What it does when `true` |
|---|---|
| `DEMO_SEED` | New workspaces get clearly-flagged sample content |
| `ALLOW_SIMULATED_CONNECTIONS` | Connect works without OAuth apps (accounts marked *simulated*) |
| `ALLOW_DEMO_BILLING` | Upgrade works without Razorpay keys (payments marked *demo*) |
| `ALLOW_LOCAL_UPLOADS` | Media uploads written to `public/uploads` (self-hosted only) |

---

## 3. Architecture map

```
src/
├─ app/api/
│  ├─ auth/            signup · login · logout · me · demo
│  ├─ oauth/[platform]/authorize · callback   ← 6-platform OAuth
│  ├─ posts/           CRUD + duplicate       ← workspace-scoped
│  ├─ accounts/toggle  disconnect account
│  ├─ media/upload     multipart → Vercel Blob / local disk
│  ├─ billing/         order · verify · demo-activate · cancel · webhook
│  ├─ jobs/publish     cron: publish due posts (all platforms)
│  ├─ jobs/sync-analytics   cron: followers/metrics snapshots
│  ├─ team/            members · invites · accept
│  ├─ ai/assist        Hive Writer (OpenAI w/ template fallback)
│  ├─ app-state · search · notifications · health
├─ lib/server/
│  ├─ env.ts           typed env access (server-only)
│  ├─ session.ts       bcrypt + DB sessions (httpOnly cookie)
│  ├─ crypto.ts        AES-256-GCM token encryption, HMAC, PKCE
│  ├─ platforms.ts     OAuth + publish adapters for all 6 networks
│  ├─ razorpay.ts      Orders REST + signature verification
│  ├─ email.ts         Resend/SMTP + HTML templates
│  ├─ jobs/            publisher engine · analytics sync
│  ├─ analytics-service.ts · seed.ts · rate-limit.ts · http.ts
└─ db/schema.ts        13 tables (users, sessions, workspaces, members,
                       invites, social_accounts, posts, post_targets,
                       media_assets, metrics_snapshots, notifications,
                       payments, invoices)
```

**Publishing flow:** `posts.status=scheduled` + one `post_targets` row per platform → every cron tick finds `scheduledAt <= now`, calls the platform adapter (real API; simulated when account is flagged), updates target + post status, writes a notification and emails the creator. Resume/retries are built in (attempt counter, `failed → retry`).

**Security:** zod-validated inputs, per-workspace scoping on every query, rate-limited auth & AI endpoints, AES-256-GCM encrypted OAuth tokens, HMAC-signed OAuth state in httpOnly cookies, PKCE for X, timing-safe signature checks, CSP/HSTS/nosniff headers (`next.config.ts`), secrets only on the server.

---

## 4. Environment variables — click-by-click

> Create each value, copy it into `.env` **and** into Vercel → Project → **Settings → Environment Variables** (all environments: Production, Preview, Development).

### 4.1 Database — `DATABASE_URL`

**Option A — Neon (recommended, free tier):**
1. Go to https://console.neon.tech → **Sign up** (GitHub login is fastest).
2. Click **New project** → name it `beevo` → region closest to you → **Create project**.
3. On the project dashboard, under **Connection details**, copy the **Pooled connection string** (starts `postgresql://…-pooler…`).
4. Paste as `DATABASE_URL`. Add `?sslmode=require` if not already present.

**Option B — Vercel Postgres:**
1. Vercel dashboard → your project → **Storage** tab → **Create Database** → **Postgres** → **Continue** → name `beevo-db` → **Create**.
2. Click **Connect Project** → accept defaults → Vercel injects `POSTGRES_URL`; copy its value as `DATABASE_URL` (or link envs automatically).

**Option C — local Docker:** `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16` → `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db"` then `CREATE DATABASE app_db;`.

Apply schema: `npx drizzle-kit push`.

### 4.2 App URL — `APP_URL` / `NEXT_PUBLIC_APP_URL`

The public origin of your deployment, **required for OAuth redirect URIs**.
1. After your first Vercel deploy, open the project → **Settings → Domains**.
2. Copy your domain (e.g. `beevo.vercel.app` or your custom domain).
3. Set both vars to `https://that-domain` (no trailing slash). Locally: `http://localhost:3000`.

### 4.3 Encryption key — `ENCRYPTION_KEY`

Encrypts OAuth tokens at rest (AES-256-GCM).
1. Terminal → run `openssl rand -base64 32`.
2. Copy the output → `ENCRYPTION_KEY`. Keep it stable — rotating it invalidates stored tokens (reconnect accounts after changing).

### 4.4 Cron secret — `CRON_SECRET`

1. Run `openssl rand -hex 32` → copy → `CRON_SECRET`.
2. Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` to `/api/jobs/publish` and `/api/jobs/sync-analytics` (schedules in `vercel.json`).
3. **Hobby plan note:** Hobby allows only *daily* cron jobs, so `vercel.json` ships with daily backstops (both jobs ~04:00 UTC). For on-time publishing every 5 minutes, enable **one** external pinger (free, pick either):
   - **GitHub Actions (included):** the repo contains `.github/workflows/beevo-scheduler.yml`. In your repo → **Settings → Secrets and variables → Actions** → _Variables_ tab → add `BEEVO_API_URL = https://your-app.vercel.app` → _Secrets_ tab → add `CRON_SECRET` (same value as your Vercel env). It pings the publisher every 5 minutes (allow ~5–10 min drift).
   - **cron-job.org:** create a free account → **Cron jobs → Create** → URL `https://your-app.vercel.app/api/jobs/publish`, every 5 minutes → under _Advanced → Headers_ add `Authorization: Bearer <CRON_SECRET>`.
   - **Vercel Pro:** unlocks native 5-minute cron — no pinger needed; just change the schedule in `vercel.json`.
   - **Self-hosted (`npm start`, Docker, VM):** no pinger needed at all — the internal scheduler in `src/instrumentation.ts` runs every 60s automatically (disable with `ENABLE_INTERNAL_CRON=false`).
4. Manual run anytime: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/jobs/publish`.

### 4.5 Email — choose **one**

**Resend (easiest, transactional):**
1. https://resend.com → **Sign Up** → verify email.
2. Dashboard → **API Keys** → **Create API Key** → name `beevo-prod` → copy the key → `RESEND_API_KEY`.
3. (For delivery beyond your own address) **Domains** → **Add Domain** → add the DNS records shown (SPF/DKIM) → wait for **Verified**.
4. Set `EMAIL_FROM="Beevo <hello@yourverifieddomain>"` (without a verified domain use `onboarding@resend.dev`).

**SMTP (Gmail example):**
1. Google Account → **Security** → enable **2-Step Verification**.
2. Below it → **App passwords** → create one named `beevo` → copy the 16-char password.
3. `SMTP_URL="smtps://you@gmail.com:APP_PASSWORD@smtp.gmail.com:465"` and `EMAIL_FROM="Beevo <you@gmail.com>"`.

### 4.6 Razorpay — INR billing (₹799/mo)

1. https://dashboard.razorpay.com → **Sign up** → complete KYC for live mode (Test mode works immediately).
2. Left sidebar → **Settings** (gear) → **API Keys** (under "Website and app settings").
3. Click **Generate Test Key** (or **Regenerate Live Key** when KYC'd) → copy **Key Id** → `RAZORPAY_KEY_ID` **and** `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value — needed client-side by Checkout.js). Copy **Key Secret** → `RAZORPAY_KEY_SECRET`.
4. **Webhook:** sidebar → **Settings → Webhooks** → **+ Add New Webhook**.
   - URL: `https://your-domain/api/billing/webhook`
   - Secret: `openssl rand -hex 20` → also paste → `RAZORPAY_WEBHOOK_SECRET`
   - Active events: tick **payment.captured** and **payment.failed** → **Save**.
5. Test checkout with card `4111 1111 1111 1111`, any future expiry/CVV, any OTP.

### 4.7 Google / YouTube — `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

1. https://console.cloud.google.com → top bar → **Select a project → New Project** → name `beevo` → **Create**.
2. Left menu → **APIs & Services → OAuth consent screen** → **External** → **Create** → fill app name + your email → **Save and continue** through Scopes (no additions needed) → add yourself under **Test users** → Save.
3. **APIs & Services → Library** → search **YouTube Data API v3** → **Enable**.
4. **APIs & Services → Credentials** → **+ Create Credentials → OAuth client ID** → Application type **Web application**.
5. Under **Authorized redirect URIs** → **Add URIs** →
   `https://your-domain/api/oauth/youtube/callback` (YouTube connection) **and**
   `https://your-domain/api/auth/google/callback` (**"Continue with Google" sign-in**) — plus the `http://localhost:3000/...` pair for dev → **Create**.
6. Copy **Client ID** / **Client secret** → env vars. The same app powers both Google sign-in and YouTube publishing.

### 4.8 Meta — Facebook + Instagram — `META_APP_ID` / `META_APP_SECRET`

1. https://developers.facebook.com → **My Apps** → **Create App**.
2. Use case **Other** → app type **Business** → name `Beevo` → **Create app**.
3. Dashboard → **Add products**: add **Facebook Login** AND **Instagram Graph API** (for IG publishing).
4. Left **Facebook Login → Settings** → **Valid OAuth Redirect URIs** → add:
   `https://your-domain/api/oauth/facebook/callback` and `https://your-domain/api/oauth/instagram/callback` → **Save changes**.
5. Left **Settings → Basic** → copy **App ID** → `META_APP_ID`, **App Secret** (click **Show**) → `META_APP_SECRET`.
6. Toggle the app from **Development** to **Live** (top bar) once reviewed; in Development only admins/testers can connect.
7. Instagram publishing requires an **Instagram Business/Creator account linked to a Facebook Page** you manage — the adapter picks it up automatically.

### 4.9 Twitter / X — `X_CLIENT_ID` / `X_CLIENT_SECRET`

1. https://developer.x.com → **Sign up for Free Account** (or use existing) → agree to terms.
2. **Projects & Apps** → default project → **+ Create App** → name `beevo` → **Next** → **App settings**.
3. **User authentication settings → Set up**:
   - App permissions → **Read and write**
   - Type of App → **Web App, Automated App or Bot**
   - Callback URI → `https://your-domain/api/oauth/twitter/callback`
   - Website URL → your domain → **Save**.
4. Back on the app page → **Keys and tokens** tab → **OAuth 2.0 Client ID and Client Secret** → copy both (secret shown once).
5. Scopes used: `tweet.read tweet.write users.read offline.access`.

### 4.10 LinkedIn — `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`

1. https://developer.linkedin.com → **Create app** → fill name, link your LinkedIn Page, agree → **Create app**.
2. **Auth** tab → **OAuth 2.0 settings → Authorized redirect URLs** → add `https://your-domain/api/oauth/linkedin/callback`.
3. **Products** tab → request **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn** (approved instantly for most apps).
4. **Auth** tab → copy **Client ID** / **Client Secret**.

### 4.11 Pinterest — `PINTEREST_APP_ID` / `PINTEREST_APP_SECRET`

1. https://developers.pinterest.com → **My apps** → **Create app** → accept terms.
2. App dashboard → **Manage** → copy **App ID** / **App secret**.
3. **Settings** section → **Redirect URIs** → add `https://your-domain/api/oauth/pinterest/callback`.
4. Trial apps allow 1 Pinterest account; submit for **Standard Access** (top ribbon) to open to all users. Scopes: `boards:read pins:read pins:write`.

### 4.12 Vercel Blob — `BLOB_READ_WRITE_TOKEN` (media uploads)

1. Vercel project → **Storage** tab → **Create Database → Blob** → **Continue** → name `beevo-media` → **Create**.
2. **Connect Project** → select your app → Vercel auto-injects `BLOB_READ_WRITE_TOKEN` (confirm under Settings → Environment Variables).
3. Redeploy. (Without it, uploads return a clear 501 on Vercel; enable `ALLOW_LOCAL_UPLOADS=true` only for self-hosting.)

### 4.13 OpenAI — `OPENAI_API_KEY` (Hive Writer AI)

1. https://platform.openai.com → **API keys** (left sidebar) → **+ Create new secret key** → name `beevo` → copy immediately.
2. Add billing credit if prompted. Model used: `gpt-4o-mini` (very low cost). Without the key, Hive Writer uses built-in brand templates.

---

## 5. Deploy to Vercel (click-by-click)

1. Push this repo to GitHub/GitLab.
2. https://vercel.com/new → **Import** the repository → **Configure Project** (Framework is auto-detected as Next.js — leave defaults).
3. **Before clicking Deploy**, expand **Environment Variables** and paste every variable from your `.env` (section 4) for **Production** (and Preview if you like).
4. Click **Deploy** → wait ~2 minutes → open the deployment URL.
5. Run the schema against your production DB once: locally set `DATABASE_URL` to the production string and run `npx drizzle-kit push`. **Or skip this** — from this version the app self-initialises the schema on its first cold start / first API call (advisory-locked, idempotent; disable with `AUTO_MIGRATE=false`).
6. Set `APP_URL` / `NEXT_PUBLIC_APP_URL` to the final domain and **Redeploy** (Deployments → ⋯ → Redeploy) so OAuth redirects use it.
7. Cron: Vercel reads `vercel.json` automatically — verify under Project → **Settings → Cron Jobs**. On **Hobby** these run once daily (04:15/04:45 UTC) as a backstop; enable the included **GitHub Actions pinger** (or cron-job.org — see §4.4) for the real 5-minute publishing loop. On **Vercel Pro** you can raise the native schedule back to `*/5 * * * *` in `vercel.json`.

**First real run checklist:** sign up a real account → connect a platform via OAuth → schedule a post 2 minutes ahead → watch it publish (or check `/api/jobs/publish` logs under Deployments → Logs) → upgrade to Pro with a Razorpay test card.

---

## 6. Troubleshooting

**"Internal server error" on signup after deploying to Vercel**
Almost always the database, in one of three states — open `https://your-app/api/health` for a live checklist:

| `db` | `schema` | Meaning & fix |
|---|---|---|
| `unconfigured` | — | `DATABASE_URL` missing → add it under Project → **Settings → Environment Variables** → **Redeploy**. |
| `down` | — | URL set but unreachable. A `127.0.0.1` / `localhost` URL **cannot be reached from Vercel** — use a hosted Postgres (§4.1). TLS is auto-enabled for remote hosts. |
| `up` | `missing` | Tables were never created. The app **self-heals automatically**: on the next cold start (or API call) it applies the embedded schema once via an advisory lock. You can also run `npx drizzle-kit push` with `DATABASE_URL` set to production (§5 step 5). Retry signup a few seconds after the first error. |

**`DrizzleError: Failed query: select ... "avatar_url", "prefs" ... from "users"` (login/Google sign-in)**
The table exists but was created by an older build — columns added later (`avatar_url`, `prefs`, billing paise columns/…) are missing, Postgres error `42703`. Recovery ladder, any one of these works:

1. **Nothing to do** — ≥ v2.1.0 trades the 500 for an automatic heal-then-retry: the request runs the upgrade synchronously and retries transparently.
2. Boot migrator runs `ALTER TABLE … ADD COLUMN IF NOT EXISTS` on every cold start — redeploy/restart once.
3. **One-click:** visit `https://<your-domain>/api/admin/migrate?key=<CRON_SECRET>` — it prints `before`/`after` drift and applies the upgrade immediately.
4. Manual SQL in the DB console:
```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "prefs" jsonb NOT NULL DEFAULT '{"timezone":"Asia/Kolkata (GMT+5:30)","digest":true}'::jsonb;
```
Verify afterwards via `https://<your-domain>/api/health` → `schema` must be `"ok"` with no `missingColumns`.

**OAuth callback lands on `/accounts?oauth_error=...`** — check `APP_URL` matches your domain exactly, the redirect URI uses `https`, the app is Live (Meta) / the user is a test user (Google), and the secret wasn't rotated after copying.

**Razorpay checkout does nothing** — `NEXT_PUBLIC_RAZORPAY_KEY_ID` must be set (same value as `RAZORPAY_KEY_ID`); verify **payment.captured** is ticked in the webhook.

**Posts stay "scheduled"** — on Hobby, cron is daily: enable the GitHub Action pinger (§4.4) or hit `/api/jobs/publish` manually with the Bearer secret.

**Signup works but no emails arrive**
Run the built-in diagnostics first: log in as owner → POST `/api/account/email-test` (or curl with your session) — it returns the exact Resend API error instead of failing silently. The three root causes, in frequency order:

1. **Sender domain not verified (most common):** Resend *rejects* (HTTP 422) every send from an unverified domain — nothing is even queued. Fix: https://dashboard.resend.com/domains → **Add Domain** → enter `beevo.in` → it shows 1 TXT (DKIM) + optional MX/SPF records → add them in your DNS provider → wait until status shows **Verified** → set `EMAIL_FROM=Beevo <hello@beevo.in>` → redeploy.
2. **Using `onboarding@resend.dev`:** only delivers to the Resend account OWNER's own email — fine for smoke tests, wrong for users.
3. **Bad/revoked key (HTTP 401):** dashboard.resend.com → API Keys → create → replace `RESEND_API_KEY` → restart.

Also check Resend → **Logs** (per-message delivery/bounce status) and make sure you're not silently using the old default sender `hello@beevo.app` (the code now warns loudly in server logs if so).

**Meta login: "App not active / This app is not accessible right now"**
Your Meta app is in **Development mode**. In Development mode only accounts with a role can OAuth: developers.facebook.com → your app → **App Review** (left nav) → toggle **"Live"** on the top banner to public. While it stays in Development: **Settings → Roles → Test Users/People** and add the Instagram/Facebook user there. Without one of these you get exactly this dialog. Also confirm both products are installed: **Products → Facebook Login** AND **Instagram Graph API**, and the redirect URIs include `https://beevo.in/api/oauth/facebook/callback` and `.../instagram/callback` (Section 4.8).

**YouTube connect: "Error 403: access_denied"**
This is a Google OAuth consent screen message — meaning the app is in **Testing** and the account isn't whitelisted, OR the sensitive YouTube scopes were never added to the consent screen. console.cloud.google.com → your project → **APIs & Services → OAuth consent screen**:
1. **Publishing status** — either **Publish app** (public; YouTube scopes will need Google verification for production) or keep **Testing** and
2. **Audience → Test users → ADD USERS** → add the exact Gmail address connecting. The Google owner of the channel must be listed.
3. **Data access (Scopes) → Add or remove scopes** → add `.../auth/youtube.upload` + `.../auth/youtube.readonly` (the 403 appears when the consent screen never declared them).
4. **APIs & Services → Library** → confirm **YouTube Data API v3** shows Enabled.
5. Reconnect from Beevo → Accounts.

---

## 7. API reference (selected)

| Method & path | Purpose | Auth |
|---|---|---|
| `POST /api/auth/signup` · `login` · `logout` · `GET /api/auth/me` · `GET /api/auth/google/start` + `callback` | Email + Google sign-in (sessions) | — / cookie |
| `GET /api/oauth/{platform}/authorize` → `{url}` | Start OAuth (or `{simulated:true}`) | owner/admin/editor |
| `GET /api/oauth/{platform}/callback` | OAuth callback (HTML redirect) | state cookie |
| `GET/POST /api/posts`, `PATCH/DELETE /api/posts/{id}`, `POST …/duplicate` | Planner CRUD (zod-validated, free-plan limit enforced) | member |
| `GET /api/media/upload` (POST, multipart) | Upload to Blob/local | member |
| `POST /api/billing/order` → `{orderId,keyId}` / `verify` / `cancel` / `demo-activate` | Razorpay INR flow | member |
| `POST /api/billing/webhook` | Razorpay events (HMAC-verified, idempotent) | signature |
| `GET|POST /api/jobs/publish` | Publish due posts | Bearer `CRON_SECRET` or owner |
| `GET|POST /api/jobs/sync-analytics` | Nightly metrics snapshots | Bearer / owner |
| `GET/POST/DELETE /api/team`, `GET /api/team/accept?token=` | Seats, roles, email invites | role-based |
| `POST /api/ai/assist` | Hive Writer captions (Pro) | member (rate-limited) |
| `GET /api/app-state` · `GET /api/search` · `PATCH /api/notifications` | App shell data | member |
| `GET /api/health` | liveness + DB | public |

Roles: **owner** (everything incl. delete), **admin** (billing/team/accounts), **editor** (posts/media/accounts), **viewer** (read-only). Seats: Free 1, Pro 3.

---

## 7. Production hardening notes

- Flip all demo toggles to `false` in production (`DEMO_SEED`, `ALLOW_SIMULATED_CONNECTIONS`, `ALLOW_DEMO_BILLING`, `ALLOW_LOCAL_UPLOADS`).
- Rate limiting is per-instance (in-memory). For strict global limits, front auth routes with Upstash Ratelimit — the helper in `src/lib/server/rate-limit.ts` is a drop-in replacement point.
- Rotate `ENCRYPTION_KEY` only with a re-encryption migration (stored tokens become undecryptable otherwise).
- Live-API metric pulls plug into `sync-analytics.ts` per platform adapter (followers/refresh already live; per-post insights hooks are marked).
- Instagram publishing requires a Business/Creator IG account linked to a managed Facebook Page (Meta policy).
