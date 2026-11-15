# Beevo User Application API & Data Contract (Phase 2 → Phase 4 Handoff)

**TypeScript Source of Truth:** `src/lib/app-types.ts` & `src/lib/app-api.ts`

This contract defines every data shape and endpoint boundary that the Phase 2 frontend consumes so Phase 4 (Supabase Auth + Postgres + OpenAI + fal.ai + ElevenLabs + FFmpeg + Cloudflare R2) can plug in without modifying UI components.

---

## 1. Authentication Contract (Supabase SSR)
| Action | Frontend Route | Phase 4 Backend Mechanism |
| --- | --- | --- |
| Sign in with email/password | `/login` | `supabase.auth.signInWithPassword({ email, password })` via `@supabase/ssr` |
| Sign up | `/signup` | `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` |
| Forgot password | `/forgot-password` | `supabase.auth.resetPasswordForEmail(email, { redirectTo })` |
| Sign out | `/app/settings`, Top Bar | `supabase.auth.signOut()` + `router.refresh()` |
| Delete account | `/app/settings` | `DELETE /api/account` (server-side cascading cleanup of R2 objects + Supabase Auth user) |
| Session verification | `middleware.ts` & Server Components | `supabase.auth.getUser()` (revalidated JWT cookie refresh) |

---

## 2. Core REST / Route Handler Endpoints

| Method | Endpoint | Consumer Route(s) | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/me` | `AppShell`, `/app`, `/app/settings` | Current user profile, notification preferences, and verified credit wallet balance |
| `PATCH` | `/api/me` | `/app/settings` | Update profile details and email notification preferences |
| `GET` | `/api/catalog/voices` | `/app/create` | Real available ElevenLabs languages, voice catalog IDs, labels, and preview URLs |
| `GET` | `/api/catalog/music` | `/app/create` | Approved licensed Beevo background music tracks filtered by mood |
| `POST` | `/api/projects` | `/app/create` | Create new project, validate credit sufficiency (`ceil(durationSeconds / 15) * 25`), kick off OpenAI script & dynamic storyboard |
| `GET` | `/api/projects` | `/app` | List authenticated user's recent projects (paginated, ordered by `updatedAt DESC`) |
| `GET` | `/api/projects/:id/storyboard` | `/app/projects/[id]/storyboard` | Fetch script, Visual Style Bible, character refs, and dynamic `StoryboardScene[]` |
| `PATCH` | `/api/projects/:id/storyboard` | `/app/projects/[id]/storyboard` | Save script edits, scene edits, additions, deletions, and reordered `orderIndex` |
| `POST` | `/api/projects/:id/storyboard/regenerate` | `/app/projects/[id]/storyboard` | Regenerate dynamic storyboard via OpenAI |
| `POST` | `/api/projects/:id/storyboard/approve` | `/app/projects/[id]/storyboard` | Approve storyboard, reserve credits, create `GenerationJob`, return `generationId` |
| `GET` | `/api/generations/:id` | `/app/generations/[id]` | Poll / stream real 10-stage generation job state, completed image assets (`X / N`), narration status, dynamic timeline segments, FFmpeg progress, credit ledger, and R2 verified MP4 |
| `GET` | `/api/videos` | `/app/videos` | Paginated, searchable, sortable, filterable list of user's videos (`VideoAsset[]`) |
| `GET` | `/api/videos/:id` | `/app/videos/[id]` | Single video metadata + time-limited Cloudflare R2 signed playback & download URLs |
| `PATCH` | `/api/videos/:id` | `/app/videos`, `/app/videos/[id]` | Rename video title |
| `DELETE` | `/api/videos/:id` | `/app/videos`, `/app/videos/[id]` | Delete video record and corresponding private R2 object |
| `GET` | `/api/credits/wallet` | `/app/credits`, `/app` | Real current balance, reserved credits, lifetime purchased credits |
| `POST` | `/api/credits/checkout` | `/app/credits` | Create verified payment checkout session for `starter` (`₹299`), `creator` (`₹599`), or `studio` (`₹899`) |
| `GET` | `/api/transactions` | `/app/transactions`, `/app` | Paginated ledger of `purchase`, `deduction`, `reservation`, `refund`, `release`, `admin_adjustment` |
| `GET` | `/api/notifications` | `/app/notifications`, `AppShell` | User notifications list & unread count |
| `PATCH` | `/api/notifications/read` | `/app/notifications` | Mark single or all notifications as read |

---

## 3. Credit Metering Contract (Client & Server Identical)
```ts
export function calculateEstimatedCredits(durationSeconds: number): number {
  const clamped = Math.max(15, Math.min(600, Math.round(durationSeconds)));
  return Math.ceil(clamped / 15) * 25;
}
```
- `15s = 25 credits`
- `30s = 50 credits`
- `60s (1 min) = 100 credits`
- `120s (2 min) = 200 credits`
- `180s (3 min) = 300 credits`
- `300s (5 min) = 500 credits`
- `600s (10 min max) = 1,000 credits`

---

## 4. Phase 2 Frontend-Only Behavior
When `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_API_BASE_URL` are not configured:
- All read adapters return `{ connected: false, data: null | [] }` with zero synthetic records.
- All mutating forms validate client-side thoroughly and display an honest, non-destructive status message clarifying that backend persistence connects in Phase 4—never simulating auth login, credit purchase, video generation, or deletion.
