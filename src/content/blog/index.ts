import type { BlogArticle, BlogCategory } from "@/lib/blog";
import { bestGumroadAlternatives } from "./best-gumroad-alternatives-india";
import { bestPlatformsToSellOnlineCoursesIndia } from "./best-platforms-to-sell-online-courses-india";
import { gumroadVsBeevo } from "./gumroad-vs-beevo";
import { howMuchToCharge } from "./how-much-to-charge-online-course-india";
import { instamojoVsGumroadVsBeevo } from "./instamojo-vs-gumroad-vs-beevo";
import { instagramToCustomers } from "./turn-instagram-audience-into-paying-customers";
import { sellDigitalProductsWithoutWebsite } from "./sell-digital-products-india-without-website";
import { sellingCoursesOnWhatsApp } from "./selling-courses-on-whatsapp";
import { stopLosingSalesToPlatformFees } from "./stop-losing-sales-to-platform-fees";
import { zeroToFirstSale } from "./zero-to-first-digital-product-sale";

/**
 * Every published article. Adding a post here is the only step needed to get
 * it on `/blog`, in `sitemap.xml`, in the "related" rotation and in the
 * reading-order links — there is no separate registry to forget to update.
 */
const ALL_ARTICLES: BlogArticle[] = [
  gumroadVsBeevo,
  bestGumroadAlternatives,
  stopLosingSalesToPlatformFees,
  instamojoVsGumroadVsBeevo,
  bestPlatformsToSellOnlineCoursesIndia,
  howMuchToCharge,
  sellDigitalProductsWithoutWebsite,
  zeroToFirstSale,
  instagramToCustomers,
  sellingCoursesOnWhatsApp,
];

function sortByNewest(articles: BlogArticle[]): BlogArticle[] {
  return [...articles].sort((a, b) => {
    if (a.publishedAt === b.publishedAt) return a.title.localeCompare(b.title);
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
}

/** All articles, newest first. */
export const BLOG_ARTICLES: BlogArticle[] = sortByNewest(ALL_ARTICLES);

const BY_SLUG = new Map(BLOG_ARTICLES.map((article) => [article.slug, article]));

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return BY_SLUG.get(slug);
}

export function getBlogSlugs(): string[] {
  return BLOG_ARTICLES.map((article) => article.slug);
}

/** The post pinned to the top of the listing (newest if none is pinned). */
export const FEATURED_ARTICLE: BlogArticle =
  BLOG_ARTICLES.find((article) => article.featured) ?? BLOG_ARTICLES[0];

/**
 * Related posts: the hand-picked slugs first (so the linking is editorial, not
 * just chronological), topped up with the newest posts from the same category.
 */
export function getRelatedArticles(article: BlogArticle, limit = 3): BlogArticle[] {
  const picked: BlogArticle[] = [];
  const push = (candidate: BlogArticle | undefined) => {
    if (!candidate || candidate.slug === article.slug) return;
    if (picked.some((existing) => existing.slug === candidate.slug)) return;
    picked.push(candidate);
  };

  for (const slug of article.related ?? []) push(BY_SLUG.get(slug));
  for (const candidate of BLOG_ARTICLES) {
    if (picked.length >= limit) break;
    if (candidate.category === article.category) push(candidate);
  }
  for (const candidate of BLOG_ARTICLES) {
    if (picked.length >= limit) break;
    push(candidate);
  }
  return picked.slice(0, limit);
}

export interface BlogSection {
  category: BlogCategory;
  articles: BlogArticle[];
}

/**
 * Articles grouped by category, with the categories ordered by their freshest
 * post — so the newest writing still appears first on the page.
 */
export const BLOG_SECTIONS: BlogSection[] = (() => {
  const groups = new Map<BlogCategory, BlogArticle[]>();
  for (const article of BLOG_ARTICLES) {
    // The featured guide already has a large card at the top of the page;
    // repeating it in its section would duplicate the same image and link.
    if (article.slug === FEATURED_ARTICLE.slug) continue;
    const list = groups.get(article.category) ?? [];
    list.push(article);
    groups.set(article.category, list);
  }
  return [...groups.entries()]
    .map(([category, articles]) => ({ category, articles: sortByNewest(articles) }))
    .filter((section) => section.articles.length > 0)
    .sort((a, b) => (a.articles[0].publishedAt < b.articles[0].publishedAt ? 1 : -1));
})();

/** Anchor id for a category section on the listing page. */
export function categoryAnchor(category: BlogCategory): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
