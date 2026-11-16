# Beevo Phase 4 — Provider Pricing & Unit Economics Research

**Date:** 2026-11-15  
**Purpose:** Verified provider pricing baselines (November 2026) used to seed Beevo's centralized configurable cost registry (`src/lib/pricing/provider-registry.ts`) and calculate true per-project unit economics and contribution margins. All unit rates remain configurable—never duplicated across route handlers.

---

## 1. Beevo Customer Revenue & Credit Packs (INR)

| Package | Price (INR, tax-inclusive) | Net Revenue (ex. 18% GST) | Credits | Video Capacity | Net Revenue / Minute |
| --- | ---: | ---: | ---: | ---: | ---: |
| **Starter** | ₹299.00 | ₹253.39 | 300 cr | 3 min | ₹84.46 / min |
| **Creator** | ₹599.00 | ₹507.63 | 800 cr | 8 min | ₹63.45 / min |
| **Studio** | ₹899.00 | ₹761.86 | 1,500 cr | 15 min | ₹50.79 / min |

- **Credit Rule:** `credits_required = ceil(duration_seconds / 15) * 25` (`100 cr = 1 min`, `25 cr = 15s`, max `10 min = 1,000 cr`).
- **Razorpay Fee Baseline (India domestic UPI/cards blended estimate):** ~2.0% + 18% GST on gateway fee (≈ `2.36%` gross), overridden by exact `fee` and `tax` paise from Razorpay payment capture webhook payloads whenever present (`actual` vs `estimated`).

---

## 2. Verified External Provider Pricing (November 2026)

### OpenAI (Responses API — Script & Dynamic Storyboard)
*No separate Responses API fee; billed purely by model input/output tokens.*

| Model | Input ($ / 1M tokens) | Output ($ / 1M tokens) | Typical 1-Min Video Cost |
| --- | ---: | ---: | ---: |
| `gpt-4o-mini` (fast / budget) | $0.15 | $0.60 | ~$0.002 (~₹0.17) |
| `gpt-4o` (balanced storytelling) | $2.50 | $10.00 | ~$0.035 (~₹2.95) |
| `gpt-5` / frontier structured (configurable) | Configurable in registry | Configurable in registry | Measured from `response.usage` |

### fal.ai (Image Generation Only — Character Sheets & Scene Illustrations)
*Verified November 2026 from `fal.ai/learn/tools/flux-image-generation-api`. Queue time and server errors are never billed.*

| Model Endpoint | Billing Unit | Published Rate (USD) | Notes |
| --- | --- | ---: | --- |
| `blackforestlabs/flux-3/klein/text-to-image` | Per output image | **$0.009** (1K) / **$0.011** (1.5K) / **$0.014** (2K) | Primary cost-efficient cartoon generator |
| `blackforestlabs/flux-3/klein/edit-image` | Per output image | **$0.009** (1K) / **$0.014** (2K) | Accepts up to **10 reference images** for character consistency |
| `blackforestlabs/flux-3/text-to-image` & `edit-image` | Per output image | **$0.048** (1K) | Premium multi-reference composition tier |
| `fal-ai/flux-2-pro` | Per megapixel | **$0.030** (1st MP) + $0.015/extra MP | Commercial API-only production fallback |
| `fal-ai/flux-pro/kontext` | Per image | **$0.040** | Commercial character/style editing fallback |

- **1-Minute Video Example (Dynamic 8–12 images + 2 character sheets @ FLUX 3 Klein 1K):** `12 × $0.009 = $0.108` (~₹9.10).

### ElevenLabs (TTS with Character Timestamps)
*Verified Oct/Nov 2026. Commercial rights require a paid plan (`Starter` $6/mo or higher / API billing).*

| Model ID | Max Chars / Request | Languages | API Rate ($ / 1,000 chars) | Typical 1-Min (~900 chars) |
| --- | ---: | ---: | ---: | ---: |
| `eleven_multilingual_v2` | 10,000 | 29 | **$0.08** | ~$0.072 (~₹6.10) |
| `eleven_v4` | 10,000 | 90+ | **$0.08** | ~$0.072 (~₹6.10) |
| `eleven_flash_v2_5` | 40,000 | 32 | **$0.04** | ~$0.036 (~₹3.05) |
| `eleven_v4_turbo` | 10,000 | 90+ | **$0.04** | ~$0.036 (~₹3.05) |

### Cloudflare R2 Storage
*Verified November 2026. Zero egress fees at all volumes.*

| Meter | Standard Rate | Monthly Free Tier |
| --- | ---: | ---: |
| Storage | **$0.015 / GB-month** | 10 GB-month |
| Class A ops (PUT/POST/LIST) | **$4.50 / million** | 1,000,000 |
| Class B ops (GET/HEAD) | **$0.36 / million** | 10,000,000 |
| Internet Egress | **$0.00 / GB** | Unlimited |

### Railway Persistent FFmpeg Worker Compute
*Verified 2026 Railway usage-based resource rates.*

| Resource | Monthly Rate | Per-Minute Rate | Notes |
| --- | ---: | ---: | --- |
| vCPU | $20.00 / vCPU-month | $0.000463 / vCPU-min | 2–4 vCPU recommended per FFmpeg worker |
| RAM | $10.00 / GB-month | $0.000231 / GB-min | 2–4 GB RAM for 1080p multi-scene filtergraphs |
| Ephemeral/Volume Disk | $0.15 / GB-month | — | Temporary workspace cleaned immediately per job |

### Resend Transactional Email
*Verified July 2026:* Free `3,000 emails/month` (`100/day`); Pro `$20/month` for `50,000 emails` (~$0.0008 overage/email).

---

## 3. Illustrative Unit Margin Check (Per Finished Video Minute, USD/INR ≈ ₹84.5)

| Cost Component | Estimated Cost / Finished Min (FLUX 3 Klein + Multilingual v2) |
| --- | ---: |
| OpenAI Script + Storyboard (`gpt-4o-mini` / `gpt-4o`) | ₹0.20 – ₹3.00 |
| fal.ai Dynamic Images (~10 images @ $0.009) | ~₹7.60 |
| ElevenLabs Narration (~900 chars @ $0.08/1K) | ~₹6.10 |
| Railway FFmpeg Render (~1.5 min on 2 vCPU / 2 GB) | ~₹0.20 |
| Cloudflare R2 Storage (~35 MB assets + MP4, $0 egress) | ~₹0.05 |
| Razorpay Gateway Fee (~2.36% on Studio ₹59.93 gross/min) | ~₹1.41 |
| **Total Variable Cost / Finished Minute** | **~₹15.60 – ₹18.40 / min** |
| **Net Revenue / Finished Minute (Studio → Starter)** | **₹50.79 – ₹84.46 / min** |
| **Target Contribution Margin** | **~64% – 78%** |

*All production profitability figures displayed in `/admin/ai-costs` are calculated strictly from real `provider_usage`, `payments`, and `render_jobs` tables, explicitly tagging `actual` provider billing vs `estimated` fallback rates.*
