# Decisions

Chronological, opinionated record. New phases append — never rewrite history.

## D1 — 2026-01 · Brand and product framing

- **Name:** Beevo. **Positioning:** "Your audience is the marketplace." The differentiator is the *absence* of a marketplace, so the marketing site says it constantly (hero, dedicated dark section, footer, FAQ, /features "absent by design" band).
- **Design language:** editorial sticker/brutalist hybrid — cream paper background, ink borders, hard offset shadows, vermilion accent, lime highlights, Space Grotesk display type with Instrument Serif italic accents, grain overlay, marquee tickers. Motivation: creator-economy energy, print-poster confidence, and a layout that reads beautifully on phones first.
- No invented social proof: no fake testimonial quotes or platform-wide stats anywhere. Storefront examples are fictional, labelled "Demo" in UI and isolated in `src/lib/mocks/`.

## D2 — Mock-first service architecture

- The UI talks to contracts, not vendors: `AuthService` in `src/lib/services/auth.ts` is the single auth surface. A `MockAuthService` implements it with deterministic, documented behaviour (`taken@demo.test`, `@fail.demo` triggers).
- Live services are the default: `REPO_SERVICE_MODE` in `src/lib/config.ts` is `"live"` and every service factory returns the real `/api/v1` adapter. `NEXT_PUBLIC_USE_MOCKS=true` remains available for isolated frontend work; no production screen advertises demo data.
- Prompt 5 will add a Supabase adapter and switch by configuration only — zero page rewrites.

## D3 — Business rules are constants, not copy

- `PLATFORM_COMMISSION_RATE = 0.08`, `FREE_PLAN`, and `commissionBreakdown()` live in `src/lib/domain.ts`. Every "₹0/month", "8%", and "92%" on the site derives from that module (or `PLATFORM_COMMISSION_LABEL`), so the rule can never drift between pages.
- All commission arithmetic is rendered with the disclaimer that gateway charges and taxes settle separately and that examples aren't earnings guarantees.
- **No Pro plan** exists in code or copy; tests/reviews should grep for "Pro" — matches intentionally appear only in "no Pro plan" statements.

## D4 — Legal copy centralised, honest, law-respecting

- All four policies (Terms, Privacy, Purchase Policy, Refund Policy) live in `src/lib/legal.ts`; pages are thin renderers. One edit updates the site.
- The refund policy states no-standard-refunds while explicitly preserving mandatory statutory remedies — we do not claim to override applicable law, and every legal page carries a not-legal-advice note.
- Payout language is exact everywhere: "recorded manually by platform administration under the intended payment arrangement, subject to provider approval."

## D5 — Rendering & routing

- App Router with a `(site)` group (marketing chrome) and an `(auth)` group (focused shell). Server components by default; client components only where interaction lives (forms, motion, toasts, menus, calculator).
- No business API routes or database tables were added in this phase (per Prompt 1 scope); scaffold `/api/health` and Drizzle config remain untouched for Prompt 5.
- Post-auth destination is `/dashboard` (`POST_AUTH_PATH`), which ships with Prompts 2–4; until then the mock success panel says so and redirects to `/` — we never fake a dashboard.

## D6 — Accessibility & quality bar

- Semantic landmarks, skip-to-content link, labelled controls, `role="alert"` on field/form errors, focus-visible rings, aria-hidden decorative illustration (hero phone mock), keyboard-operable accordion/menu, `prefers-reduced-motion` support.
- Every control does something real: CTA links navigate, accordion/menu toggles, forms validate and submit through the adapter, toasts dismiss. No decorative buttons.
- Fonts via `next/font` (self-hosted, no layout shift); images via `next/image` with sized placeholders.

## D7 — Environment variable naming

- One canonical list in `.env.example`, reused by all phases. Supabase/Razorpay/Resend/R2 names are reserved now so Prompt 5 adds zero new naming decisions.

## D8 — 2026-01 · Creator Studio (Prompt 2)

- **Shell:** dedicated `(creator)` route group with its own mobile-first chrome — sidebar on desktop, bottom tab bar + "More" sheet on phones. A lime demo strip is always visible and hosts explicit demo controls ("Fail next request", "Reset demo data") so every state (loading/empty/failed/populated) is exercisable on demand.
- **Service-first architecture, again:** creator UI consumes three contracts — `CourseService`, `MediaService`, `CreatorDataService` — each with registry getters returning `null` when unconfigured (pages then show the unavailable panel rather than faking a workspace).
- **Drafts behave like the future product:** `/creator/courses/new` requests a real (mock) draft then opens the editor at stage "details"; mock persistence goes to `sessionStorage` so leaving/resuming works; all mutations flow through service calls, never local-only state.
- **Autosave UX:** immediate validation → 800ms debounce → visible Saving/Saved states → failure preserves input + Retry. Same pattern for title, description, outcomes; cover/price save explicitly.
- **Uploads are honest simulations:** file validation mirrors the future R2 limits (`UPLOAD_RULES`); progress/cancel/retry exercise the same AsyncSurface the real R2 adapter will use; every mock `MediaRef` is `simulated: true` and the UI says "no file left your device".
- **Curriculum ordering**: array order is canonical; up/down arrows (touch-friendly, no dnd library) send ordered-id arrays to the service; optimistic UI reverts on failure.
- **Publish is validated twice:** client checklist for guidance, service-side re-validation returning stage-grouped `fieldErrors` — exactly how Prompt 5's route behaves.
- **Reordering, deletion, publish, unpublish, archive** all have explicit behavior with confirmation dialogs where destructive.
- **Commission math has a single implementation** (`commissionBreakdown`, round-half-up to paise) reused by pricing stage, orders, analytics, and earnings; the pricing stage calls itself a frontend estimate and defers authority to server checkout.

## D9 — 2026-01 · Storefront, checkout & learner app (Prompt 3)

- **Public routes** `/@username` and `/@username/course-slug` are implemented with a `[handle]` dynamic segment that requires the literal `@` prefix (anything else → `notFound()`), placed inside the marketing `(site)` group so the pages inherit public chrome plus a "Powered by Beevo" footer strip. No marketplace/catalogue/discovery feed exists — period.
- **Single demo source of truth:** the storefront reads the same mock course DB the studio writes to, so publishing/unpublishing in Prompt 2's editor immediately changes what's public. Only `published` courses are ever returned; unknown handles and non-published courses get neutral not-found states that leak nothing.
- **Public payloads are delivery-safe** by construction: `PublicLessonMeta` carries titles/descriptions/counts/durations + one `isPreview` flag — never media refs, storage keys, signed URLs, or payment internals.
- **Checkout is an explicit state machine** (`ready → creating_order → checkout_open → processing → success | failed | cancelled | pending`) whose simulated gateway panel offers labeled outcome choices, so every state is testable — while every receipt states "no money was charged". Sign-in happens inline mid-checkout and the course card stays in context (the handoff requirement). Order/enrolment recording is idempotent by orderId.
- **Learner app** mirrors the studio shell pattern with its own gate: without a demo session, a sign-in panel stands in for /learn (handoff), not a fake dashboard. Progress + playback position persist to sessionStorage with "demo session only" copy; the simulated player is a self-contained component the Prompt 5 R2-backed player replaces behind the same props; resource downloads produce honest placeholder Blob files.
- **No standard refunds anywhere:** purchase policy strip on sales page, checkout footer, purchases page, and receipts — link to the policy, never a button.

## D10 — 2026-01 · Admin console (Prompt 4)

- **Simulated session, loudly:** the admin gate is an explicit demo sign-in panel ("not real security; server authorization arrives in Prompt 5"), visually distinct (dark ink shell, red demo strip). No claims of protection — just a route-separation demo.
- **Financial truth is derived, never typed:** every money figure comes from base records through single functions inside `AdminService` (`ledger()`, `earningsFor()`). Pages are display-only; an "outstanding" balance can never be worded as paid money, and the UI spells out gross / commission / gateway-est. / share / payable / paid-out / outstanding distinctly.
- **Payout workflow mirrors the real process:** pending record → human transfers at the bank → reference entry. The Record button is hard-gated on a ≥6-char reference + valid date; recording requires a final confirm; only `pending → recorded` via that path, with `failed`/`cancelled` requiring audit notes. Nothing marks anything paid implicitly, and every transition appends to per-payout history + the global audit log.
- **Moderation has declared blast radius:** course unpublish/flag and creator suspension state in copy that learner access and financial records are untouched; orders stay read-only except a documented "reviewed" flag; disputes carry note timelines and guarded status transitions; settings expose honest flags (the Razorpay connection status is read-only because provider approval can't be a UI toggle).
- **Audit as a product surface:** all mutations write `AdminEvent`s (actor, area, action, detail, kind) visible in `/admin/audit-logs` plus contextual timelines in creator/payout/dispute views — the mock behaves exactly like the Prompt 5 requirement.

## Limitations of this phase (by design)

- Auth, payments, email, storage are mock/absent; the "unavailable" panels make that explicit.
- All business API routes, provider webhooks, and real authorization are Prompt 5.
- Admin records are fictional and labelled; payout recordings simulate bookkeeping only — no transfer is triggered, no real bank data is ever collected.
