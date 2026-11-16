# Beevo Unit Economics & Provider Cost Analysis (November 2026)

**Pricing Registry:** `src/lib/pricing/provider-registry.ts` (FX baseline configurable via `USD_TO_INR_RATE`, default `₹85.00 / USD`).

## 1. Per-Minute Production Cost Model (Typical Balanced Pacing, ~10 Dynamic Scenes/Min)

| Provider & Stage | Model / Resource | Unit Price (Official Docs, Nov 2026) | 1-Min Video Est. (USD) | 1-Min Video Est. (INR @ ₹85) |
|---|---|---|---:|---:|
| OpenAI Script | `gpt-4o-mini` | $0.15 / 1M in, $0.60 / 1M out | ~$0.001 | ~₹0.09 |
| OpenAI Storyboard | `gpt-4o` | $2.50 / 1M in, $10.00 / 1M out | ~$0.025 | ~₹2.13 |
| fal.ai Character + Scenes | `blackforestlabs/flux-3/klein` (12 imgs incl. 2 chars) | $0.009 / 1K image | ~$0.108 | ~₹9.18 |
| ElevenLabs TTS + Timestamps | `eleven_multilingual_v2` (~1,000 chars/min, Pro overage) | ~$0.08–$0.12 / 1,000 chars | ~$0.090 | ~₹7.65 |
| Railway FFmpeg Render | Dedicated Docker vCPU/RAM (~60–90s render) | ~$0.000463/vCPU-sec | ~$0.015 | ~₹1.28 |
| Cloudflare R2 Storage | Private object storage + **$0 egress** | $0.015 / GB-month | ~$0.001 | ~₹0.09 |
| **Total Variable Production Cost** | | | **~$0.240** | **~₹20.42 / min** |

## 2. Gross Margin by Credit Package (After 2.36% Razorpay Gateway Fee + GST)

| Credit Pack | Price (INR) | Net After ~2.36% Gateway | Credits | Max Video Min | Max Variable Cost (~₹20.42/min) | Est. Contribution Margin |
|---|---:|---:|---:|---:|---:|---:|
| **Starter** | ₹299 | ₹291.94 | 300 | 3 min | ~₹61.26 | **~₹230.68 (~79.0%)** |
| **Creator** | ₹599 | ₹584.86 | 800 | 8 min | ~₹163.36 | **~₹421.50 (~72.1%)** |
| **Studio** | ₹899 | ₹877.78 | 1,500 | 15 min | ~₹306.30 | **~₹571.48 (~65.1%)** |

Every production API call logs exact token counts, image counts, character counts, render seconds, and computed `cost_usd` / `cost_inr` into `provider_usage`, powering live unit economics inside `/admin/ai-costs` and `/admin/overview` (`GET /api/admin/costs`).
