import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * /robots.txt
 *
 * Deliberately permissive for public pages, with two exceptions:
 *  - `/api/` is crawl noise (JSON endpoints), except the public media
 *    delivery route, which serves course covers and creator avatars that
 *    Google Images and social scrapers need to fetch;
 *  - `/_next/` is never blocked — Google must fetch the JS/CSS chunks to
 *    render the page as a user sees it.
 *
 * Private pages (/creator/*, /learn/*, /admin/*, auth screens) are NOT
 * disallowed here. They carry `noindex` robots metadata instead, because a
 * URL blocked in robots.txt can never be crawled to see its `noindex` — the
 * page would stay eligible for "indexed, though blocked" listings.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/v1/media/access"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
