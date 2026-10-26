/**
 * SEO primitives — the single source of truth for canonical URLs, page
 * metadata, and schema.org structured data.
 *
 * Rules this module enforces:
 *  - every public page declares ONE canonical URL on the production origin
 *    (`NEXT_PUBLIC_APP_URL`, normalised in `src/lib/config.ts`);
 *  - every public page declares its own title, description, Open Graph and
 *    Twitter card (Next does not deep-merge `openGraph`, so partial page
 *    objects would silently drop the shared image);
 *  - structured data only describes what the page actually shows — no fake
 *    ratings, review counts, learner numbers, or social profiles.
 */
import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE, APP_URL, SUPPORT_EMAIL } from "@/lib/config";
import { priceLabel } from "@/lib/domain";
import type {
  PublicCoursePage,
  PublicCreatorInfo,
  PublicCreatorPage,
} from "@/lib/learner-types";

/** Canonical production origin — `https://beevo.in` unless configured. */
export const SITE_URL = APP_URL;
export const SITE_NAME = APP_NAME;
export const SITE_LOCALE = "en_IN";
export const SITE_LANGUAGE = "en-IN";

export const SITE_DESCRIPTION =
  "Beevo gives creators a personal storefront to sell courses directly to their own audience. Free plan at ₹0/month, flat 8% only on successful eligible sales. No marketplace.";

/** Default social card (1200×630) used wherever a page has no better image. */
export const DEFAULT_OG_IMAGE = {
  url: "/images/brand/beevo-og.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${APP_TAGLINE}`,
} as const;

/** Brand mark used by Organization structured data and app icons. */
export const BRAND_MARK_PATH = "/images/brand/beevo-mark.png";

/**
 * Date the static marketing/legal copy was last edited. Bump this when the
 * copy changes so `sitemap.xml` carries an honest `lastmod` for those pages.
 */
export const STATIC_CONTENT_UPDATED = new Date("2026-10-26T00:00:00.000Z");

/** Pages that belong in `sitemap.xml`, with their crawl priorities. */
export const STATIC_SITEMAP_PAGES: {
  path: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/features", changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 },
];

/** Robots directives for pages that should be indexed normally. */
export const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/** Robots directives for private or not-yet-ready pages. */
export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

/** Robots directives for public pages that must not be indexed yet. */
export const NOINDEX_FOLLOW_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

/** Absolute URL for an app path (already-absolute URLs pass through). */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path === "/" || path === "") return SITE_URL;
  return new URL(path.startsWith("/") ? path : `/${path}`, `${SITE_URL}/`).toString();
}

/** Canonical URL for an app path. */
export function canonicalUrl(path: string): string {
  return absoluteUrl(path);
}

/**
 * Shorten free-form copy into a meta description that fits a search snippet
 * without cutting a word in half. Collapses whitespace first.
 */
export function metaDescription(input: string, maxLength = 158): string {
  const clean = input.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const cut = lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${cut.replace(/[,;:.\-–—]+$/, "")}…`;
}

export interface PageSeoOptions {
  /** Page title without the root `%s · Beevo` suffix. */
  title: string;
  /** Set when the title already contains the brand (homepage). */
  absoluteTitle?: boolean;
  description: string;
  /** App path used for the canonical and `og:url`. Always the canonical form. */
  path: string;
  type?: "website" | "article" | "profile";
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  robots?: Metadata["robots"];
  keywords?: string[];
  /** Extra Open Graph fields required for `type: "article"` pages. */
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authors?: string[];
    section?: string;
    tags?: string[];
  };
}

/**
 * Build complete page metadata. Everything a crawler or social scraper needs
 * is emitted from one object, so pages cannot drift into partial (duplicate
 * or missing) metadata.
 */
export function createPageMetadata(options: PageSeoOptions): Metadata {
  const canonical = canonicalUrl(options.path);
  const description = metaDescription(options.description);
  const ogTitle = options.title.includes(SITE_NAME)
    ? options.title
    : `${options.title} · ${SITE_NAME}`;
  const images =
    options.images && options.images.length > 0
      ? options.images.map((image) => ({
          url: absoluteUrl(image.url),
          ...(image.width ? { width: image.width, height: image.height } : {}),
          ...(image.alt ? { alt: image.alt } : {}),
        }))
      : [
          {
            url: absoluteUrl(DEFAULT_OG_IMAGE.url),
            width: DEFAULT_OG_IMAGE.width,
            height: DEFAULT_OG_IMAGE.height,
            alt: DEFAULT_OG_IMAGE.alt,
          },
        ];

  const sharedOpenGraph = {
    url: canonical,
    title: ogTitle,
    description,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images,
  };

  // Article pages carry published/modified times, byline and tags. Next does
  // not deep-merge `openGraph`, so the shared fields are repeated here on
  // purpose rather than spread from the root layout.
  const openGraph: Metadata["openGraph"] =
    options.type === "article"
      ? {
          ...sharedOpenGraph,
          type: "article",
          ...(options.article?.publishedTime
            ? { publishedTime: options.article.publishedTime }
            : {}),
          ...(options.article?.modifiedTime
            ? { modifiedTime: options.article.modifiedTime }
            : {}),
          ...(options.article?.authors ? { authors: options.article.authors } : {}),
          ...(options.article?.section ? { section: options.article.section } : {}),
          ...(options.article?.tags ? { tags: options.article.tags } : {}),
        }
      : { ...sharedOpenGraph, type: options.type ?? "website" };

  return {
    title: options.absoluteTitle ? { absolute: options.title } : options.title,
    description,
    keywords: options.keywords,
    alternates: { canonical },
    robots: options.robots ?? INDEXABLE_ROBOTS,
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: images.map((image) => image.url),
    },
  };
}

// ---------------------------------------------------------------------------
// schema.org structured data
// ---------------------------------------------------------------------------

type JsonLdNode = Record<string, unknown>;

/** Wrap schema nodes in a single `@graph` document. */
export function schemaGraph(nodes: JsonLdNode[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Organization identity. No `sameAs` profiles and no postal address are
 * invented — those are added only when real, verified accounts/addresses
 * exist. `logo` is a crawlable square brand mark.
 */
export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: "Beevo India",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(BRAND_MARK_PATH),
      width: 256,
      height: 256,
    },
    description: SITE_DESCRIPTION,
    email: SUPPORT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      areaServed: "IN",
      availableLanguage: "en",
    },
  };
}

/**
 * WebSite entity. `potentialAction` (SearchAction) is deliberately absent:
 * Beevo has no public site search, and claiming one would be inaccurate.
 */
export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Organization + WebSite graph rendered once in the root layout. */
export function siteJsonLd(): JsonLdNode {
  return schemaGraph([organizationNode(), websiteNode()]);
}

/** The free product plan, matching the visible ₹0/month pricing copy. */
export function softwareApplicationNode(): JsonLdNode {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Online course platform",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": ORGANIZATION_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: SITE_URL,
    },
  };
}

export interface FaqGroupLike {
  group: string;
  items: { q: string; a: string }[];
}

/** FAQPage graph for the questions rendered on /faq. */
export function faqPageJsonLd(groups: readonly FaqGroupLike[]): JsonLdNode {
  return schemaGraph([
    {
      "@type": "FAQPage",
      "@id": `${absoluteUrl("/faq")}#faq`,
      url: absoluteUrl("/faq"),
      name: `${SITE_NAME} frequently asked questions`,
      inLanguage: SITE_LANGUAGE,
      mainEntity: groups.flatMap((group) =>
        group.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      ),
    },
  ]);
}

/** Convert the storefront runtime label ("1h 30m") into ISO 8601 ("PT1H30M"). */
export function toIsoDuration(label: string): string | null {
  const hours = /(\d+)\s*h/i.exec(label);
  const minutes = /(\d+)\s*m/i.exec(label);
  if (!hours && !minutes) return null;
  const parts = `${hours ? `${hours[1]}H` : ""}${minutes ? `${minutes[1]}M` : ""}`;
  return parts ? `PT${parts}` : null;
}

/**
 * Course rich-result data for a published course sales page.
 *
 * Only facts the page displays are emitted: title, description, price, lesson
 * runtime, creator, provider. No aggregateRating (Beevo has no ratings) and
 * no enrolment counts (learner data is private).
 */
export function courseJsonLd(course: PublicCoursePage, courseUrl: string): JsonLdNode {
  const creatorUrl = absoluteUrl(`/@${course.creator.handle}`);
  const isoDuration = toIsoDuration(course.durationLabel);
  const isFree = course.priceInPaise === 0;

  const node: JsonLdNode = {
    "@type": "Course",
    "@id": `${courseUrl}#course`,
    name: course.title,
    description: course.shortDescription || `${course.title} — an online course by ${course.creator.displayName}.`,
    url: courseUrl,
    inLanguage: SITE_LANGUAGE,
    isAccessibleForFree: isFree,
    provider: { "@id": ORGANIZATION_ID },
    creator: {
      "@type": "Person",
      name: course.creator.displayName,
      alternateName: `@${course.creator.handle}`,
      url: creatorUrl,
      ...(course.creator.avatarUrl ? { image: absoluteUrl(course.creator.avatarUrl) } : {}),
    },
    offers: {
      "@type": "Offer",
      price: (course.priceInPaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      category: isFree ? "Free" : "Paid",
      url: courseUrl,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      ...(isoDuration ? { courseWorkload: isoDuration } : {}),
    },
    ...(course.coverPreviewUrl ? { image: absoluteUrl(course.coverPreviewUrl) } : {}),
  };

  return node;
}

/** ProfilePage + Person graph for a public creator storefront. */
export function profilePageJsonLd(
  creator: PublicCreatorPage,
  pageUrl: string,
): JsonLdNode {
  const sameAs = creator.links
    .map((link) => link.url)
    .filter((url) => /^https?:\/\//i.test(url));

  return schemaGraph([
    {
      "@type": "ProfilePage",
      "@id": `${pageUrl}#profile`,
      url: pageUrl,
      name: `${creator.displayName} (@${creator.handle})`,
      inLanguage: SITE_LANGUAGE,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: {
        "@type": "Person",
        "@id": `${pageUrl}#person`,
        name: creator.displayName,
        alternateName: `@${creator.handle}`,
        description: creator.tagline || creator.niche,
        url: pageUrl,
        ...(creator.avatarUrl ? { image: absoluteUrl(creator.avatarUrl) } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
        jobTitle: creator.niche || "Creator",
      },
    },
  ]);
}

/** BreadcrumbList for the visible storefront → course trail. */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): JsonLdNode {
  return schemaGraph([
    {
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ]);
}

/**
 * Article structured data for a blog post.
 *
 * `author` and `publisher` point at the Organization because the Beevo blog is
 * written by the team, not by an invented persona with fake credentials. Dates
 * are the real publication date and the last edit, never the request time.
 */
export function articleJsonLd(input: {
  url: string;
  title: string;
  description: string;
  image: { url: string; width: number; height: number };
  publishedAt: string;
  updatedAt?: string;
  section: string;
  tags: string[];
}): JsonLdNode {
  return schemaGraph([
    {
      "@type": "Article",
      "@id": `${input.url}#article`,
      mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
      url: input.url,
      headline: input.title,
      description: input.description,
      image: {
        "@type": "ImageObject",
        url: absoluteUrl(input.image.url),
        width: input.image.width,
        height: input.image.height,
      },
      datePublished: input.publishedAt,
      dateModified: input.updatedAt ?? input.publishedAt,
      author: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: SITE_LANGUAGE,
      articleSection: input.section,
      keywords: input.tags.join(", "),
    },
  ]);
}

/** CollectionPage + ItemList for the /blog index. */
export function blogIndexJsonLd(
  posts: { slug: string; title: string }[],
  description: string,
): JsonLdNode {
  const url = absoluteUrl("/blog");
  return schemaGraph([
    {
      "@type": "CollectionPage",
      "@id": `${url}#collection`,
      url,
      name: `${SITE_NAME} blog`,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: SITE_LANGUAGE,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: posts.length,
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/blog/${post.slug}`),
          name: post.title,
        })),
      },
    },
  ]);
}

/** Human title for a creator storefront page. */
export function creatorPageTitle(creator: PublicCreatorInfo): string {
  return `${creator.displayName} (@${creator.handle})`;
}

/**
 * Storefront description. Uses the creator's own tagline when present and
 * adds the number of published courses, so two creators in the same niche
 * never share an identical snippet.
 */
export function creatorPageDescription(
  creator: PublicCreatorInfo,
  courseCount = 0,
): string {
  const niche = creator.niche ? `${creator.niche} creator` : "creator";
  const catalogue =
    courseCount === 1
      ? "1 published course to browse, with secure UPI, card, and net-banking checkout."
      : `${courseCount} published courses to browse, with secure UPI, card, and net-banking checkout.`;
  const base =
    creator.tagline ||
    `${creator.displayName} is a ${niche} on Beevo.`;
  return metaDescription(courseCount > 0 ? `${base} ${catalogue}` : base);
}

/** Description for a course sales page, built from visible page facts. */
export function coursePageDescription(course: PublicCoursePage): string {
  const facts = [
    `${course.lessonCount} ${course.lessonCount === 1 ? "lesson" : "lessons"}`,
    `${course.durationLabel} of video`,
    course.creator.displayName,
    priceLabel(course.priceInPaise) === "FREE"
      ? "free"
      : `${priceLabel(course.priceInPaise)} one-time`,
  ];
  return metaDescription(
    [course.shortDescription, facts.join(" · ")].filter(Boolean).join(" "),
  );
}
