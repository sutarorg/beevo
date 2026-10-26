import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  STATIC_CONTENT_UPDATED,
  STATIC_SITEMAP_PAGES,
} from "@/lib/seo";
import { listPublishedCourseUrls } from "@/server/storefront-data";

/**
 * /sitemap.xml — static marketing pages + every published storefront/course.
 *
 * Rules:
 *  - only `published` courses from non-suspended creators are listed (the
 *    same published-only rule the pages enforce), so the sitemap can never
 *    advertise a URL that answers 404;
 *  - an empty creator storefront is not listed (it is deliberately
 *    `noindex, follow` until it has a course to rank for);
 *  - if the database is unreachable the static marketing entries are still
 *    served — a degraded sitemap beats a 500;
 *  - regenerated hourly (ISR) so newly published courses appear without a
 *    redeploy.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_SITEMAP_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: STATIC_CONTENT_UPDATED,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const courseRows = await listPublishedCourseUrls();

  // One storefront entry per creator, dated by their most recently updated
  // published course.
  const storefrontLastModified = new Map<string, Date>();
  for (const row of courseRows) {
    const previous = storefrontLastModified.get(row.handle);
    if (!previous || row.lastModified > previous) {
      storefrontLastModified.set(row.handle, row.lastModified);
    }
  }

  const storefrontEntries: MetadataRoute.Sitemap = [...storefrontLastModified.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([handle, lastModified]) => ({
      url: absoluteUrl(`/@${encodeURIComponent(handle)}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const courseEntries: MetadataRoute.Sitemap = courseRows
    .sort((a, b) => a.handle.localeCompare(b.handle) || a.slug.localeCompare(b.slug))
    .map((row) => ({
      url: absoluteUrl(
        `/@${encodeURIComponent(row.handle)}/${encodeURIComponent(row.slug)}`,
      ),
      lastModified: row.lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  // Sitemaps are capped at 50,000 URLs per file. Entering that territory
  // requires a sitemap index; until then one file is correct and simplest.
  return [...staticEntries, ...storefrontEntries, ...courseEntries].slice(0, 50_000);
}
