# Beevo Technical SEO Plan

Aligned with Google Search Central documentation, Next.js App Router Metadata API, Core Web Vitals (`LCP ≤ 2.5s`, `INP ≤ 200ms`, `CLS ≤ 0.1`), and WCAG 2.2 AA.

## 1. Metadata & Canonical Strategy
- **`metadataBase`:** Configured centrally in `src/app/layout.tsx` via `process.env.NEXT_PUBLIC_SITE_URL || "https://beevo.app"` (gracefully adaptable to production domain).
- **Title Template:** `template: "%s | Beevo"` with unique, concise, search-intent-aligned titles on every one of the 12 public routes (50–60 chars target).
- **Meta Descriptions:** Unique factual descriptions (140–160 chars) per page, free of keyword stuffing or fabricated claims.
- **Canonical URLs:** Every indexable route sets an explicit `alternates: { canonical: "/..." }`.
- **Open Graph & Twitter Cards:** Complete `openGraph` (`title`, `description`, `url`, `siteName`, `type: "website"`, `images: [{ url: "/images/beevo/og-beevo.png", width: 1200, height: 630 }]`) and `twitter` (`card: "summary_large_image"`) metadata.

## 2. Crawlability, Indexing & Noindex Policy
- **Server-Side Rendering:** Every public marketing page is a React Server Component rendering complete semantic HTML (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`) with one `<h1>` per page and strict `h1 → h2 → h3` order.
- **`robots.ts`:** Allows `/` for standard crawlers and explicitly disallows private/auth spaces (`/app/`, `/dashboard/`, `/admin/`, `/api/`, `/login`, `/get-started`).
- **Route-level `robots` noindex:** Both `/login` and `/get-started` explicitly export `robots: { index: false, follow: false }` so even external links never leak them into search indexes.
- **`sitemap.ts`:** Exposes strictly the 12 canonical public marketing URLs with accurate `changeFrequency` and `priority`.

## 3. Structured Data (JSON-LD)
All JSON-LD blocks are strictly truthful—**zero invented `AggregateRating`, zero fake `Review` entities**:
- **Root Layout / Homepage:**
  - `Organization`: Beevo brand identity, URL, geometric logo URL.
  - `WebSite`: Site name, URL, description.
  - `SoftwareApplication`: Category `MultimediaApplication`, `operatingSystem: "Web"`, truthful description of Beevo's illustrated cartoon storytelling workflow, and `offers` array referencing the three confirmed INR one-time credit packs (`₹299`, `₹599`, `₹899`).
- **Pricing Page (`/pricing`):**
  - `Product` / `OfferCatalog` structured data for Starter (`₹299` / 300 credits), Creator (`₹599` / 800 credits), and Studio (`₹899` / 1,500 credits) with `priceCurrency: "INR"` and accurate availability/description.
- **FAQ Page (`/faq`) & Homepage FAQ:**
  - `FAQPage` JSON-LD matching the exact visible FAQ question-and-answer text.
- **Subpages (`/features`, `/how-it-works`, `/pricing`, `/use-cases/*`, `/faq`, `/contact`, legal pages):**
  - `BreadcrumbList` JSON-LD matching visible on-page breadcrumb navigation.

## 4. Core Web Vitals & Media Optimization
- **Fonts:** `Sora` and `Manrope` self-hosted via `next/font/google` with `display: "swap"` and automatic fallback size-adjust to eliminate CLS.
- **Images:** All original illustrations exported as optimized `.webp` inside `public/images/beevo/`, rendered through `next/image` with accurate `width`/`height` and tailored `sizes` attributes.
- **Preloading Discipline:** `priority` is placed ONLY on the above-the-fold hero visual; all below-the-fold illustrations, example thumbnails, and visual style samples lazy-load naturally.
- **Descriptive Alt Text:** Informative illustrations carry clear natural alt descriptions; purely decorative elements (flight trails, corner sparkles) carry `aria-hidden="true"` and `alt=""`.
