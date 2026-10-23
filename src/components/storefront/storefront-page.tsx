"use client";

import { useAsyncData } from "@/lib/hooks";
import { getStorefrontService } from "@/lib/services/storefront";
import {
  CreatorHero,
  CreatorNotFound,
  EmptyStorefrontState,
  PoweredByBanner,
  StorefrontCourseCard,
} from "@/components/storefront/cards";
import { FailedState, Skeleton } from "@/components/creator/ui";

export function CreatorStorefront({ handle }: { handle: string }) {
  const service = getStorefrontService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getCreator(handle)
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Storefront service unavailable" } }),
    [handle],
  );

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (state.status === "error") {
    if (state.error.code === "not_found") return <CreatorNotFound />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <FailedState title="Storefront temporarily unavailable" body={state.error.message} onRetry={reload} />
      </div>
    );
  }

  const creator = state.data;

  return (
    <>
      <CreatorHero creator={creator} />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Courses by {creator.displayName.split(" ")[0]}
        </h2>
        {creator.courses.length === 0 ? (
          <div className="mt-8">
            <EmptyStorefrontState handle={handle} />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {creator.courses.map((course) => (
              <StorefrontCourseCard key={course.id} course={course} handle={handle} />
            ))}
          </div>
        )}
      </section>
      <PoweredByBanner />
    </>
  );
}
