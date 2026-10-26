/**
 * Blog content model.
 *
 * Articles are typed data, not MDX or a database table: every post ships in
 * the build, so the listing, article body, table of contents, related-article
 * cards, JSON-LD and `sitemap.xml` all read from one source and can never
 * disagree with each other.
 *
 * Copy rules for anything added here:
 *  - facts about other platforms are quoted from their own published pricing
 *    pages and carry a `sources` entry with the date they were checked;
 *  - no invented statistics, testimonials, or earnings claims;
 *  - Beevo's own commercial terms come from `@/lib/domain`, never retyped.
 */

export type BlogCategory =
  | "Comparisons"
  | "Pricing"
  | "Launch playbooks"
  | "Audience"
  | "Selling in India";

export interface BlogSource {
  /** Human label, e.g. "Gumroad — pricing". */
  label: string;
  url: string;
  /** The date the figure was read from that page (ISO). */
  checked: string;
}

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "callout"; tone?: "lime" | "accent" | "ink"; title?: string; text: string }
  | {
      type: "table";
      caption?: string;
      head: string[];
      rows: string[][];
      note?: string;
    }
  | { type: "cta"; title: string; body: string; label?: string; href?: string }
  | { type: "widget"; widget: "fee-calculator" }
  | { type: "faq"; items: { q: string; a: string }[] };

export interface BlogImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface BlogArticle {
  slug: string;
  /** On-page H1. */
  title: string;
  /** Meta/social title when it should differ from the H1. */
  seoTitle?: string;
  /** Meta description — also the excerpt when `excerpt` is absent. */
  description: string;
  /** Card copy on the listing page; falls back to `description`. */
  excerpt?: string;
  category: BlogCategory;
  tags: string[];
  /** ISO date (yyyy-mm-dd). */
  publishedAt: string;
  updatedAt?: string;
  image: BlogImage;
  /** Pinned to the top of the listing. */
  featured?: boolean;
  takeaways: string[];
  blocks: BlogBlock[];
  /** Slugs of hand-picked related posts (cards fall back to the same category). */
  related?: string[];
  /** Figures/claims borrowed from other platforms' own pages. */
  sources?: BlogSource[];
  /** Overrides the default closing CTA for this post. */
  cta?: { title: string; body: string };
}

export interface TocEntry {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface HeadingWithId {
  id: string;
  text: string;
}

/** Blocks with a resolved anchor id — computed once per article. */
export type ResolvedBlock =
  | (Extract<BlogBlock, { type: "h2" | "h3" }> & { id: string })
  | Exclude<BlogBlock, { type: "h2" | "h3" }>;

/** The byline. A real product team, not a fake persona with invented credentials. */
export const BLOG_AUTHOR = {
  name: "The Beevo team",
  role: "Product & creator success, Beevo",
  bio: "We build Beevo — a storefront for creators who already have an audience — and we talk to the people selling on it every week. These guides come from that work.",
} as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function parseIsoDate(iso: string): Date {
  // Constructed as UTC so the rendered date never shifts with the server's
  // timezone (a "25 October" post must not print "24 October" in production).
  return new Date(`${iso}T00:00:00Z`);
}

/** "26 October 2026" — matches the legal pages' long-date style. */
export function formatPostDate(iso: string): string {
  const date = parseIsoDate(iso);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Anchor ids for headings: lowercase, alphanumeric, single dashes. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    // Apostrophes vanish rather than becoming a separator: "can't" should
    // anchor as #cant, not #can-t.
    .replace(/['\u2019\u2018"\u201c\u201d]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function stripInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function blockText(block: BlogBlock): string {
  switch (block.type) {
    case "p":
    case "h2":
    case "h3":
    case "quote":
      return stripInline(block.text);
    case "ul":
    case "ol":
      return block.items.map(stripInline).join(" ");
    case "callout":
      return `${block.title ?? ""} ${stripInline(block.text)}`;
    case "table":
      return [block.caption ?? "", ...block.head, ...block.rows.flat(), block.note ?? ""]
        .map(stripInline)
        .join(" ");
    case "cta":
      return `${block.title} ${block.body}`;
    case "faq":
      return block.items.map((item) => `${item.q} ${stripInline(item.a)}`).join(" ");
    case "widget":
      return "";
    default:
      return "";
  }
}

/**
 * Reading time at a deliberately conservative 200 words/minute — these posts
 * are dense with numbers, and over-promising speed is worse than under-selling it.
 */
export function readingTimeMinutes(article: BlogArticle): number {
  const words = article.blocks
    .map(blockText)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Resolve heading anchors once, keeping ids unique within the article. */
export function resolveArticleBlocks(article: BlogArticle): {
  blocks: ResolvedBlock[];
  toc: TocEntry[];
} {
  const seen = new Map<string, number>();
  const toc: TocEntry[] = [];
  const blocks: ResolvedBlock[] = article.blocks.map((block) => {
    if (block.type !== "h2" && block.type !== "h3") return block;
    const base = slugifyHeading(stripInline(block.text)) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    toc.push({ id, title: stripInline(block.text), level: block.type === "h2" ? 2 : 3 });
    return { ...block, id };
  });
  // The FAQ block renders its own h2 ("Frequently asked questions"), so it
  // belongs in the contents list even though the heading is not authored copy.
  if (article.blocks.some((block) => block.type === "faq")) {
    toc.push({ id: "faq", title: "Frequently asked questions", level: 2 });
  }

  return { blocks, toc };
}

/** Category tint used by the listing cards and article header. */
export const CATEGORY_STYLES: Record<BlogCategory, { sticker: "lime" | "accent" | "cream" | "ink" }> = {
  Comparisons: { sticker: "accent" },
  Pricing: { sticker: "lime" },
  "Launch playbooks": { sticker: "ink" },
  Audience: { sticker: "cream" },
  "Selling in India": { sticker: "lime" },
};
