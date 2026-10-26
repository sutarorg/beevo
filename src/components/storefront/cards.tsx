import { ArrowRight, ArrowUpRight, Ghost, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { priceLabel } from "@/lib/domain";
import type { PublicCourseCard, PublicCreatorPage } from "@/lib/learner-types";
import { Button } from "@/components/ui/button";
import { ProfileAvatar, Sticker } from "@/components/ui/primitives";

/** Public creator header — avatar, identity, bio, links. */
export function CreatorHero({ creator }: { creator: PublicCreatorPage }) {
  return (
    <header className="border-b-2 border-ink bg-parchment">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:flex lg:items-center lg:gap-12 lg:py-20 lg:text-left">
        <ProfileAvatar
          src={creator.avatarUrl}
          name={creator.displayName}
          sizePx={160}
          priority
          className="mx-auto size-28 shadow-hard-sm sm:size-32 lg:mx-0 lg:size-40"
        />
        <div className="lg:min-w-0 lg:flex-1">
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-5xl lg:mt-0">
            {creator.displayName}
          </h1>
          <p className="mt-1.5 text-base font-bold text-accent-deep sm:text-lg">@{creator.handle}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-pretty text-smoke sm:text-base lg:mx-0 lg:max-w-2xl">
            {creator.tagline}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
            <Sticker color="lime">{creator.niche}</Sticker>
            {creator.links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-ink uppercase shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                {link.label}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            ))}
          </div>
          <p className="mt-5 text-xs font-semibold text-smoke">
            {creator.courses.length} published course{creator.courses.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </header>
  );
}

/** Course card linking to the course sales page. */
export function StorefrontCourseCard({
  course,
  handle,
}: {
  course: PublicCourseCard;
  handle: string;
}) {
  return (
    <Link
      href={`/@${handle}/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard-sm transition-transform duration-200 hover:-translate-y-1.5"
    >
      {/* Course thumbnail is always 16:9, matching the uploaded cover. */}
      <div className="relative aspect-video border-b-2 border-ink bg-parchment">
        {course.coverPreviewUrl ? (
          <Image
            src={course.coverPreviewUrl}
            alt={`${course.title} course cover`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center font-editorial text-4xl text-ink/20 italic">
            {course.title.slice(0, 1)}
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-full border-2 border-ink bg-lime px-3 py-1 text-sm font-bold shadow-hard-xs">
          {priceLabel(course.priceInPaise)}
        </span>
        {course.priceInPaise === 0 ? (
          <span className="absolute top-3 right-3 rounded-full border-2 border-ink bg-white px-2.5 py-1 text-[10px] font-black tracking-[0.14em] uppercase">
            No payment
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent-deep sm:text-xl">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-smoke">
          {course.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-ink/15 pt-3">
          <span className="text-xs font-semibold text-smoke">
            {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-accent-deep">
            View course
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EmptyStorefrontState({ handle }: { handle: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-ink/40 bg-white/60 px-6 py-14 text-center">
      <Ghost className="mx-auto size-8 text-smoke" aria-hidden="true" />
      <h3 className="mt-3 text-xl font-bold text-ink">No courses yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-smoke">
        @{handle} hasn&apos;t published any courses right now. Follow their links above — new
        courses usually get announced there first.
      </p>
    </div>
  );
}

/** "Powered by Beevo" strip at the bottom of every storefront. */
export function PoweredByBanner() {
  return (
    <aside aria-label="About Beevo" className="border-t-2 border-ink bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-cream/80">
          <Sparkles className="size-4 text-lime" aria-hidden="true" />
          <span>
            This storefront runs on{" "}
            <Link
              href="/"
              className="font-bold text-cream underline decoration-lime/60 underline-offset-4 hover:decoration-lime"
            >
              Beevo
            </Link>
            .
          </span>
        </p>
        <Button href="/signup" variant="lime" size="sm">
          Create yours free
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </aside>
  );
}
