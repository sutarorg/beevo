import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { CreatorStorefront } from "@/components/storefront/storefront-page";
import {
  absoluteUrl,
  createPageMetadata,
  creatorPageDescription,
  creatorPageTitle,
  NOINDEX_FOLLOW_ROBOTS,
  profilePageJsonLd,
} from "@/lib/seo";
import { parseHandleSegment } from "@/lib/storefront-path";
import {
  isStorefrontMaintenanceMode,
  loadPublicCreatorPage,
} from "@/server/storefront-data";

/**
 * Public creator storefront — server rendered.
 *
 * The whole page (creator identity + every published course) is in the first
 * HTML response, so Google and link-preview bots never need to run the client
 * app to see the content. Data and metadata come from the same published-only
 * query, and an unknown or suspended handle returns a real HTTP 404.
 *
 * Revalidated on demand: a creator's publish/unpublish shows up within a
 * minute without giving up cached, fast responses.
 */
export const revalidate = 60;

function handleFromParams(raw: string): string {
  const handle = parseHandleSegment(raw);
  if (!handle) notFound();
  return handle;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const handle = handleFromParams((await params).handle);
  if (await isStorefrontMaintenanceMode()) {
    throw new Error("Storefronts are temporarily unavailable for scheduled maintenance.");
  }
  const creator = await loadPublicCreatorPage(handle);
  if (!creator) notFound();

  // A storefront with no published courses is a thin page: keep it crawlable
  // (follow) but out of the index until it has something to rank for.
  const readyForIndex = creator.courses.length > 0;

  return createPageMetadata({
    title: creatorPageTitle(creator),
    description: creatorPageDescription(creator, creator.courses.length),
    path: `/@${creator.handle}`,
    type: "profile",
    robots: readyForIndex ? undefined : NOINDEX_FOLLOW_ROBOTS,
    images: creator.avatarUrl
      ? [
          {
            url: creator.avatarUrl,
            alt: `${creator.displayName} profile photo`,
          },
        ]
      : undefined,
    keywords: [
      creator.displayName,
      `@${creator.handle}`,
      creator.niche,
      "online courses",
    ],
  });
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const handle = handleFromParams((await params).handle);
  if (await isStorefrontMaintenanceMode()) {
    throw new Error("Storefronts are temporarily unavailable for scheduled maintenance.");
  }
  const creator = await loadPublicCreatorPage(handle);
  if (!creator) notFound();

  return (
    <>
      <JsonLd
        id="creator-profile-structured-data"
        data={profilePageJsonLd(creator, absoluteUrl(`/@${creator.handle}`))}
      />
      <CreatorStorefront creator={creator} />
    </>
  );
}
