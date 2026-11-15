# Beevo Logo Specification

## 1. Design Philosophy
Beevo's logo is an original, minimal geometric vector mark inspired by a honeybee and subtle hexagonal craft. Unlike the detailed 3D character mascot, the icon mark is engineered for clarity from `16 px` browser favicons up to large brand applications and remains identical across Phases 1–4.

## 2. Geometric Construction
- **Canvas Grid:** `32 × 32` coordinate system (`viewBox="0 0 32 32"`), snapped to clean geometric radii and optical balance.
- **Core Geometry:**
  1. **Symmetrical Geometric Wings (Upper Left & Right):** Two crisp pill-teardrop arcs angled outward at ~32° from the dorsal center, rendered in light warm-white/pale-honey with a crisp charcoal outline (or solid negative cutouts in monochrome).
  2. **Rounded Honeycomb-Capsule Body (Center-Lower):** A friendly hexagonal-rounded pill body in Beevo Yellow (`#FFC928`) anchored with a bold `2.2 px` charcoal ink stroke (`#171717`).
  3. **Two Clean Horizontal Stripes:** Two geometric dark charcoal bands (`#171717`) proportioned generously so they never collapse into muddy hairlines at `16 px`.
  4. **Minimal Twin Antennae Accents:** Two short symmetrical upward strokes at the crown giving unmistakable "bee" silhouette recognition without microscopic dots or clutter.

## 3. Approved Logo Variants (`src/components/brand/BeevoLogo.tsx`)

| Variant | Composition | Primary Use | Minimum Size |
| --- | --- | --- | --- |
| `icon` | Geometric bee mark only | Browser favicon, compact badges, square app icon | `16 × 16 px` |
| `horizontal` | `26 px` icon mark + `8 px` gap + bold lowercase `beevo` (`Sora` 800, `-0.04em` tracking) | Desktop & tablet top header, footer | Icon `24 px` / Height `28 px` |
| `compact` | `24 px` icon mark + tighter `6 px` gap + compact `beevo` wordmark | Mobile navigation bar (`320–430 px`) | Icon `22 px` / Height `24 px` |
| `monochrome` | Single-color dark charcoal (`#171717`) or inverted white mark + wordmark | Print, legal headers, muted footers, dark overlays | `16 × 16 px` |
| `favicon` | `src/app/icon.svg` & `public/favicon.svg` — icon nested on crisp rounded warm-white/yellow tile for tab clarity in both light and dark browser chrome | Browser tabs, bookmarks | `16 × 16 px` |

## 4. Legibility Verification Matrix
The icon mark is tested at five required render sizes:
- **`16 px`:** Outer wing silhouette + golden body + 2 crisp dark bands remain distinct with zero stroke fusion.
- **`20 px`:** Clear wing separation and balanced weight alongside small UI captions.
- **`24 px`:** Ideal mobile navbar and footer lockup scale.
- **`32 px`:** Native viewBox crispness for desktop cards and favicons.
- **`48 px`:** Showcase and touch-icon fidelity without appearing bare or overly complex.

## 5. Clear Space & Usage Prohibitions
- Maintain minimum clear space equal to `0.5×` the icon height around all sides of the lockup.
- Never replace the geometric icon mark in the navbar with the full 3D illustrated mascot.
- Never stretch, rotate, add drop shadows to the wordmark, or change the wordmark casing to `BEEVO` inside the logo lockup.
