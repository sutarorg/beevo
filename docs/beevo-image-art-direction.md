# Beevo Image Art Direction & Asset Registry

## 1. Global Art Direction Standard
- **Visual Style:** Premium, charming 3D animated family-film illustration with soft rounded geometry, tactile matte/satin materials, expressive friendly faces, gentle warm morning daylight, and shallow depth of field.
- **Color Harmony:** Beevo honey yellow (`#FFC928`), warm charcoal (`#171717`), ivory/warm cream (`#FFF9E9`), fresh meadow green, sky blue, and controlled cheerful flower accents.
- **Strict Character Continuity:** A canonical **Beevo Mascot Master Reference** (`assets-src/beevo/beevo-mascot-reference.png`) was generated and visually verified first, then passed as an explicit image reference for every subsequent AI-generated asset featuring Beevo:
  - Round bright honey-yellow head & body
  - Two crisp horizontal black body stripes + short dark fuzzy neck collar
  - Oversized round black-rimmed glasses with large warm brown expressive eyes
  - Cheerful curved smile, two curved dark-tipped antennae, delicate translucent pale-blue veined wings, small charcoal shoes
- **Zero Rasterized UI Text:** No generated text, logos, watermarks, fake buttons, or UI chrome inside any scene image. The hero wooden signpost was generated completely blank so semantic HTML overlays (`Describe it`, `Generate it`, `Download it`) render crisply and responsively at every breakpoint.

## 2. Production Asset Registry (`public/images/beevo/`)

All 26 production assets were exported to optimized WebP (plus `1200 × 630` PNG for Open Graph) and audited via contact sheet (`qa-screenshots/asset-contact-sheet.png`).

| Asset File | Source / Pipeline | Dimensions | Role | Audit Status |
| --- | --- | --- | --- | --- |
| `beevo-mascot-reference.webp` | Native AI 3D Render (master reference) | 900w | Canonical character anchor | Approved |
| `hero-beevo-desktop.webp` | Native AI 3D Render (mascot ref) | 1312 × 816 | Desktop/tablet hero meadow + blank 3-plank wooden sign | Approved |
| `hero-beevo-mobile.webp` | Native AI 3D Render (mascot ref) | 928 × 1152 | Dedicated 4:5 portrait mobile hero + blank 3-plank wooden sign | Approved |
| `step-describe.webp` | Native AI 3D Render (isolated prop) | 640 × 460 | Step 1 card prop: 3D clipboard & yellow pencil | Approved |
| `step-generate.webp` | Native AI 3D Render (isolated prop) | 640 × 460 | Step 2 card prop: 3D movie clapperboard with blue play glyph | Approved |
| `step-download.webp` | Native AI 3D Render (isolated prop) | 640 × 460 | Step 3 card prop: 3D glossy violet-purple download pill | Approved |
| `bee-flight-doodle.webp` | Native AI 3D Render (mascot ref, alpha cutout) | 320w | Small flying Beevo accent paired with SVG dotted loop | Approved |
| `intelligent-storyboard.webp` | Native AI 3D Render (mascot ref) | 1376 × 768 | Section 7: 5-frame 3D storyboard tabletop progression | Approved |
| `final-cta-beevo.webp` | Native AI 3D Render (mascot ref, alpha cutout) | 560w | Section 15: Celebratory Beevo mascot beside honey star | Approved |
| `example-bee-life.webp` | Native AI 3D Render (mascot ref) | 1280 × 720 | Illustrative demo 1: The Life Cycle of a Bee | Approved |
| `example-save-planet.webp` | Native AI 3D Render | 1280 × 720 | Illustrative demo 2: Save Our Planet | Approved |
| `example-solar-system.webp` | Native AI 3D Render (mascot ref) | 1280 × 720 | Illustrative demo 3: The Solar System | Approved |
| `example-healthy-habits.webp` | Native AI 3D Render | 1280 × 720 | Illustrative demo 4: Healthy Habits for Kids | Approved |
| `style-3d-cartoon.webp` | Native AI 3D Render (`example-bee-life.png` base) | 1280 × 720 | Visual Style 1: 3D Cartoon | Approved |
| `style-2d-cartoon.webp` | Native AI Image-to-Image Style Transfer (same meadow ref) | 1280 × 720 | Visual Style 2: 2D Cartoon | Approved |
| `style-anime-inspired.webp` | Native AI Image-to-Image Style Transfer (same meadow ref) | 1280 × 720 | Visual Style 3: Anime Inspired | Approved |
| `style-storybook.webp` | Native AI Image-to-Image Style Transfer (same meadow ref) | 1280 × 720 | Visual Style 4: Storybook | Approved |
| `style-clay-animation.webp` | Native AI Image-to-Image Style Transfer (same meadow ref) | 1280 × 720 | Visual Style 5: Clay Animation | Approved |
| `style-comic-book.webp` | Native AI Image-to-Image Style Transfer (same meadow ref) | 1280 × 720 | Visual Style 6: Comic Book | Approved |
| `style-watercolor.webp` | Native AI Image-to-Image Style Transfer (same meadow ref) | 1280 × 720 | Visual Style 7: Watercolor | Approved |
| `style-flat-vector.webp` | Native AI Image-to-Image Style Transfer (same meadow ref) | 1280 × 720 | Visual Style 8: Flat Vector | Approved |
| `social-share-beevo.webp` | Native AI 3D Render (mascot ref, 1:1) | 1080 × 1080 | Square text-free social portrait | Approved |
| `og-beevo.png` | Branded Open Graph card with crisp HTML/SVG typography + native AI 3D Beevo hero | 1200 × 630 | Open Graph / Twitter share card | Approved |
| `usecase-education.webp` | Native AI 3D Render (mascot ref, 16:9) | 1280 × 720 | Education & Kids Learning scene | Approved |
| `usecase-creators.webp` | Native AI 3D Render (mascot ref, 16:9) | 1280 × 720 | YouTube & Content Creators studio scene | Approved |
| `usecase-business.webp` | Native AI 3D Render (mascot ref, 16:9) | 1280 × 720 | Business Explainers & Training easel scene | Approved |

*Generation Status:* **100% Complete Native AI Visual Suite.** Every single illustration across all 25 visual WebP assets (mascot master reference, desktop & mobile heroes, 3 step props, flying bee accent, intelligent storyboard, final CTA mascot, all 4 example video thumbnails, all 8 same-subject visual style transfers, all 3 use-case scenes, and the 1:1 square social portrait) is a standalone native AI-generated PNG stored under `assets-src/beevo/` and exported to optimized WebP via `scripts/build-assets.mjs` with zero baked-in text or watermarks. Only `og-beevo.png` pairs crisp HTML/SVG Open Graph share copy with the native AI 3D hero artwork.
