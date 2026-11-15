# Beevo Public Routes & Architecture Map

## 1. Public Indexable Marketing Routes

| Route | Page Purpose | Primary Intent | Key Sections / Features |
| --- | --- | --- | --- |
| `/` | Homepage | Core product discovery & conversion | Reference-matched 16-section landing page: Split Hero, Overlapping Benefit Strip, 4 Compact Feature Cards, Cream 3-Step Band, 4 Illustrative Example Demos, 3-Card Pricing, Intelligent Storyboard, 7-Stage Workflow, Why Illustrated Storytelling, 8-Style Visual Showcase, Use Cases, Creative Controls Preview, Workflow Comparison, FAQ Accordion, Final CTA, Footer. |
| `/features` | Capabilities & Architecture | Product capability evaluation | Detailed breakdown of OpenAI Storyboarding, fal.ai Consistent Characters & Illustrations, ElevenLabs Timestamp-Aligned Voices, Dynamic Timeline Engine, FFmpeg Motion/Captions/Audio, 8-Style Interactive Gallery, Creative Controls overview. |
| `/how-it-works` | Pipeline Deep Dive | Technical trust & process understanding | 3-Step Quick Summary + full 7-stage visual breakdown (`Prompt → Script → Storyboard → Illustrations → Narration → Dynamic Timeline → Finished MP4`), Dynamic Scene Allocation explanation, Architecture transparency table. |
| `/pricing` | One-Time Credit Packs | Purchase decision & cost clarity | Starter (₹299), Creator (₹599), Studio (₹899) cards + interactive **Credit-to-Duration Calculator** (`100 credits = 1 min`, `25 credits = 15 sec`, max 10 min/project) + What's Included in Every Pack + Pricing & Refund FAQ. |
| `/use-cases/education` | Education & Kids Learning | Educators, tutors, parents, EdTech | Tailored storytelling benefits for classroom explainers, science & nature concepts, children's learning stories, Hindi/English narration, illustrative demo references. |
| `/use-cases/content-creators` | YouTube & Social Creators | Storytellers, explainer channels, Shorts | Consistent character series, 16:9 / 9:16 / 1:1 formats, dynamic pacing, multi-minute videos up to 10 min, pay-per-pack credit predictability without monthly burn. |
| `/use-cases/business-explainers` | Business & Training | Founders, HR/L&D, product teams | Product walkthroughs, onboarding modules, SOP/compliance explainers, clear visual metaphors without hiring external animation studios or managing complex timelines. |
| `/faq` | Knowledge Base & FAQ | Objection handling & self-service answers | Filterable/categorized accessible FAQ covering Product & Animation Method, Storyboard & Visuals, Voice & Languages, Credits & Billing, and Technical Reliability. |
| `/contact` | Support & Inquiries | Support, billing, partnership inquiries | Accessible client-validated inquiry form with topic selector (General Support, Credits & Billing, Education/Bulk Inquiries, Bug Report) and transparent response expectations. |
| `/privacy` | Privacy Policy | Legal & data transparency | Clear explanation of account data, user scripts/prompts, private Cloudflare R2 storage, and AI processing roles (OpenAI, fal.ai, ElevenLabs). |
| `/terms` | Terms of Service | Legal contract | Account terms, one-time credit usage, content ownership & acceptable use, 10-minute project limits, service availability. |
| `/refund-policy` | Refund & Credit Policy | Billing confidence | Automatic credit restoration on failed generations, non-expiring credit policy, transparent refund eligibility for unused credit packs. |

## 2. Non-Indexable Utility & Handoff Routes (`robots: { index: false, follow: false }`)
- `/login` — Clean Phase 1 Studio sign-in preview screen (disallowed in `robots.txt` + `noindex` meta).
- `/get-started` — Credit pack handoff preview supporting `?pack=starter|creator|studio` query selection (disallowed in `robots.txt` + `noindex` meta).
- `/not-found` — Custom branded 404 recovery page.

## 3. Technical Endpoints
- `/sitemap.xml` — Dynamically generated via `src/app/sitemap.ts` listing ONLY the 12 public indexable routes.
- `/robots.txt` — Generated via `src/app/robots.ts` allowing public crawling while disallowing `/api/`, `/admin/`, `/app/`, `/dashboard/`, `/login`, `/get-started`.
- `/opengraph-image` — Static/configured Open Graph social image (`public/images/beevo/og-beevo.png`, `1200 × 630 px`).

## 4. Redirect & Trailing-Slash Policy
- Canonical URLs omit trailing slashes (`trailingSlash: false` in `next.config.ts`).
- Legacy or shortcut redirects configured cleanly in `next.config.ts` (e.g. `/use-cases` → `/use-cases/education`, `/examples` → `/#examples`).
