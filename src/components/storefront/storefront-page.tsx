import type { PublicCreatorPage } from "@/lib/learner-types";
import {
  CreatorHero,
  EmptyStorefrontState,
  PoweredByBanner,
  StorefrontCourseCard,
} from "@/components/storefront/cards";

/**
 * Public creator storefront body.
 *
 * Presentational only — the page route loads the published creator + courses
 * on the server and passes them in, so this markup arrives in the initial
 * HTML. That is what lets search engines (and link previews) see real course
 * titles, prices, and descriptions instead of a loading skeleton.
 */
export function CreatorStorefront({ creator }: { creator: PublicCreatorPage }) {
  const firstName = creator.displayName.trim().split(/\s+/)[0] || creator.displayName;

  return (
    <>
      <CreatorHero creator={creator} />
      <section
        aria-labelledby="storefront-courses-heading"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="storefront-courses-heading"
            className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
          >
            Courses by {firstName}
          </h2>
          {creator.courses.length > 0 ? (
            <p className="text-xs font-bold tracking-[0.14em] text-smoke uppercase">
              {creator.courses.length} course{creator.courses.length === 1 ? "" : "s"} · pick your
              starting point
            </p>
          ) : null}
        </div>
        {creator.courses.length === 0 ? (
          <div className="mt-8">
            <EmptyStorefrontState handle={creator.handle} />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creator.courses.map((course) => (
              <StorefrontCourseCard key={course.id} course={course} handle={creator.handle} />
            ))}
          </div>
        )}
      </section>
      <PoweredByBanner />
    </>
  );
}
