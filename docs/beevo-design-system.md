# Beevo Design System Specification

## 1. Visual Calibration & Layout Architecture
Calibrated directly against the `941 × 1,672 px` Beevo homepage visual authority and scaled responsively across `320 px` to `1,920 px+`.

- **Max Content Rail:** `1,220 px` (within the `1,180–1,240 px` working width target)
- **Horizontal Page Gutter:** `clamp(18px, 4.8vw, 64px)` (`18–20 px` on mobile, `28–40 px` on tablet, `46–64 px` on desktop)
- **Desktop Grid:** 12-column rail with `20–24 px` gutters
- **Hero Split Ratio:** `44%` text column / `56%` artwork column on desktop
- **Vertical Section Padding:** Compact editorial rhythm (`52–72 px` vertical desktop padding; `40–52 px` mobile) so sections breathe without hollow 140 px voids
- **Base Spacing Scale:** `4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80 px`

## 2. CSS Design Tokens (`src/app/globals.css`)

```css
:root {
  --beevo-yellow: #FFC928;
  --beevo-yellow-hover: #F2B800;
  --beevo-honey: #E5A500;
  --beevo-honey-text: #C48400; /* WCAG AA compliant for eyebrow & small emphasis */
  --beevo-honey-display: #DF9E00; /* Luminous honey-gold for large H1/H2 display lines */
  --beevo-ink: #171717;
  --beevo-body: #36332D;
  --beevo-muted: #6C675E;
  --beevo-white: #FFFFFF;
  --beevo-canvas: #FFFEFB;
  --beevo-cream: #FFF9E9;
  --beevo-cream-deep: #FFF4D8;
  --beevo-border: #ECE7DB;
  --beevo-border-warm: #F3DF9E;
  --beevo-shadow: 0 8px 24px rgba(52, 39, 8, 0.055);
  --beevo-shadow-card: 0 6px 20px rgba(52, 39, 8, 0.048);
  --beevo-shadow-popular: 0 12px 32px rgba(229, 165, 0, 0.14);
  --beevo-shadow-cta: 0 6px 18px rgba(242, 184, 0, 0.34);
}
```

## 3. Typography System (`next/font/google`)
- **Display Font (`--font-sora`):** `Sora` (weights `600`, `700`, `800`) — rounded geometric friendliness matching the reference's crisp, approachable headlines.
- **Body & UI Font (`--font-manrope`):** `Manrope` (weights `400`, `500`, `600`, `700`, `800`) — super-legible humanist-geometric UI sans with crisp tabular numerals for `₹` pricing and durations.

| Token | Desktop Target | Mobile Target | Weight | Line Height | Tracking |
| --- | --- | --- | --- | --- | --- |
| **Hero H1** | `clamp(2.45rem, 4.1vw, 3.55rem)` (`~50–56 px`) | `2.15–2.45rem` | `800` | `1.10` | `-0.04em` |
| **Section H2** | `clamp(1.85rem, 2.8vw, 2.35rem)` (`~32–38 px`) | `1.65–1.85rem` | `800` | `1.15` | `-0.03em` |
| **Subheading H3** | `1.125–1.375rem` (`18–22 px`) | `1.125rem` | `700` | `1.25` | `-0.02em` |
| **Card Title** | `0.9375–1rem` (`15–16 px`) | `0.9375rem` | `700` | `1.30` | `-0.015em` |
| **Body Lead** | `0.9375–1rem` (`15–16 px`) | `0.9375rem` | `500` | `1.62` | `0` |
| **Compact Card Copy** | `0.8125–0.875rem` (`13–14 px`) | `0.875rem` | `500` | `1.55` | `0` |
| **Eyebrow Tag** | `0.75rem` (`12 px`) | `0.75rem` | `700` | `1.20` | `0` |
| **Nav & Metadata** | `0.8125rem` (`13 px`) | `0.875rem` | `600` | `1.30` | `0` |

## 4. Radii, Borders & Elevation
- **Compact Cards (Features, Steps):** `16 px` radius, `1 px solid #ECE7DB`, `var(--beevo-shadow-card)`
- **Large Panels (Overlapping Strip, Pricing Cards, Editorial Inset, Final CTA):** `18–22 px` radius
- **Thumbnail Frames (16:9 Examples & Visual Styles):** `14 px` radius, `1 px solid rgba(23, 23, 23, 0.08)`
- **Eyebrow Badge:** `8–10 px` radius (NOT oversized pill capsules everywhere), `1 px solid #F3DF9E`, `#FFFDF5` background, `#B87800` bold text, compact `5px 11px` padding
- **Buttons:** Fully pill-shaped (`9999px`) for hero & card actions; subtle rounded pill (`12–9999px`) for header CTA (`height: 38–44 px` with full `44 px` touch target on mobile/tablet)
  - Primary CTA: `linear-gradient(180deg, #FFD344 0%, #FFC31F 100%)` hover `#F2B800`, `#171717` bold text, `var(--beevo-shadow-cta)`
  - Secondary CTA: `#FFFFFF`, `1 px solid #E4DEC9`, `#171717` bold text, subtle hover warm tint `#FFFDF4`

## 5. Motion & Accessibility Rules
- Purposeful, restrained motion only: subtle `translateY(-2px)` card hover lift (`200ms ease`), gentle button press feedback, smooth CSS accordion disclosure.
- Zero scroll-jacking, zero heavy parallax, zero distracting infinite bounce loops on foreground text.
- Full `@media (prefers-reduced-motion: reduce)` override collapsing transitions and decorative animations cleanly.
- Every interactive control satisfies WCAG 2.2 AA (`≥ 44 × 44 px` touch target on touch devices, clear `2 px solid #171717` focus ring with `2 px` offset).
