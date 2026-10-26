import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { CourseSalesPage } from "@/components/storefront/sales-page";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  courseJsonLd,
  coursePageDescription,
  createPageMetadata,
} from "@/lib/seo";
import { parseHandleSegment, parseSlugSegment } from "@/lib/storefront-path";
import {
  isStorefrontMaintenanceMode,
  loadPublicCoursePage,
} from "@/server/storefront-data";

/**
 * Public course sales page — server rendered.
 *
 * Only published courses resolve; drafts, unpublished and archived courses
 * (and unknown handles) return a real HTTP 404 instead of a client-rendered
 * "not found" panel with a 200 status. The visible page is in the initial
 * HTML, with Course + BreadcrumbList structured data describing exactly the
 * course, creator, price, and runtime shown on screen.
 */
export const revalidate = 60;

function segmentsFromParams(params: { handle: string; slug: string }): {
  handle: string;
  slug: string;
} {
  const handle = parseHandleSegment(params.handle);
  const slug = parseSlugSegment(params.slug);
  if (!handle || !slug) notFound();
  return { handle, slug };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  const { handle, slug } = segmentsFromParams(await params);
  if (await isStorefrontMaintenanceMode()) {
    throw new Error("Storefronts are temporarily unavailable for scheduled maintenance.");
  }
  const course = await loadPublicCoursePage(handle, slug);
  if (!course) notFound();

  return createPageMetadata({
    title: `${course.title} — ${course.creator.displayName}`,
    description: coursePageDescription(course),
    path: `/@${course.creator.handle}/${course.slug}`,
    images: course.coverPreviewUrl
      ? [
          {
            url: course.coverPreviewUrl,
            alt: `${course.title} course cover`,
          },
        ]
      : undefined,
    keywords: [
      course.title,
      course.creator.displayName,
      course.creator.niche,
      "online course",
    ],
  });
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = segmentsFromParams(await params);
  if (await isStorefrontMaintenanceMode()) {
    throw new Error("Storefronts are temporarily unavailable for scheduled maintenance.");
  }
  const course = await loadPublicCoursePage(handle, slug);
  if (!course) notFound();

  const creatorUrl = absoluteUrl(`/@${course.creator.handle}`);
  const courseUrl = absoluteUrl(`/@${course.creator.handle}/${course.slug}`);

  return (
    <>
      <JsonLd
        id="course-breadcrumb-structured-data"
        data={breadcrumbJsonLd([
          { name: `${course.creator.displayName} (@${course.creator.handle})`, url: creatorUrl },
          { name: course.title, url: courseUrl },
        ])}
      />
      <JsonLd id="course-structured-data" data={courseJsonLd(course, courseUrl)} />
      <CourseSalesPage course={course} />
    </>
  );
}
