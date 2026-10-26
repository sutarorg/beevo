import { route } from "@/server/router";
import { fail, ok } from "@/server/http";
import {
  isStorefrontMaintenanceMode,
  loadPreviewPlayback,
  loadPublicCoursePage,
  loadPublicCreatorPage,
  StorefrontUnavailableError,
} from "@/server/storefront-data";

/**
 * Public storefront API.
 *
 * The data layer lives in `src/server/storefront-data.ts` so the same
 * published-only reads power the server-rendered storefront pages. Handlers
 * only translate outcomes into HTTP: 404 for missing/unpublished, 503 for
 * maintenance or an unavailable database.
 *
 * Cache headers: public storefront payloads are intentionally cacheable by
 * browsers/CDNs (a creator's edit becomes visible within a minute), while
 * failures are always `no-store`.
 */

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
} as const;

const MAINTENANCE_MESSAGE =
  "Storefronts are temporarily undergoing scheduled maintenance. Please check back shortly.";

function unavailableResponse(error: unknown) {
  if (error instanceof StorefrontUnavailableError) {
    return fail("service_unavailable", error.message, 503);
  }
  throw error;
}

route("GET", "storefront/:handle", async (_req, _ctx, params) => {
  try {
    if (await isStorefrontMaintenanceMode()) {
      return fail("maintenance", MAINTENANCE_MESSAGE, 503);
    }
    const page = await loadPublicCreatorPage(params.handle);
    if (!page) {
      return fail("not_found", "This creator page doesn't exist or isn't public anymore.", 404);
    }
    return ok(page, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return unavailableResponse(error);
  }
});

route("GET", "storefront/:handle/:slug", async (_req, _ctx, params) => {
  try {
    if (await isStorefrontMaintenanceMode()) {
      return fail("maintenance", MAINTENANCE_MESSAGE, 503);
    }
    const page = await loadPublicCoursePage(params.handle, params.slug);
    if (!page) {
      return fail(
        "not_found",
        "This course isn't available. It may be unpublished, archived, or the link is wrong.",
        404,
      );
    }
    return ok(page, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return unavailableResponse(error);
  }
});

route("GET", "storefront/:handle/:slug/lessons/:lessonId/preview", async (_req, _ctx, params) => {
  try {
    if (await isStorefrontMaintenanceMode()) {
      return fail("maintenance", MAINTENANCE_MESSAGE, 503);
    }
    const result = await loadPreviewPlayback(params.handle, params.slug, params.lessonId);
    switch (result.status) {
      case "ok":
        return ok(result.playback);
      case "not_found":
        return fail("not_found", "This course isn't available right now.", 404);
      case "not_a_preview":
        return fail(
          "not_a_preview",
          "This lesson isn't a free preview. Enrol in the course to watch it.",
          403,
        );
      case "preview_unavailable":
        return fail(
          "preview_unavailable",
          "The preview video isn't ready yet — try again shortly.",
          409,
        );
    }
  } catch (error) {
    return unavailableResponse(error);
  }
});
