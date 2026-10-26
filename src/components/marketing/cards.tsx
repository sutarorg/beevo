import { Bell, Clock3, Video } from "lucide-react";
import Image from "next/image";
import type { CourseSummary, CreatorPublicProfile } from "@/lib/domain";
import { formatINR } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CourseCard({
  course,
  className,
}: {
  course: CourseSummary;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group rounded-3xl border-2 border-ink bg-white p-3 shadow-hard-sm transition-transform duration-200 hover:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-ink">
        <Image
          src={course.coverUrl}
          alt={`${course.title} course cover`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 rounded-full border-2 border-ink bg-lime px-2.5 py-1 text-xs font-bold shadow-hard-xs">
          {formatINR(course.priceInPaise)}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-bold text-ink sm:text-lg">
            {course.title}
          </h3>
          <span className="shrink-0 rounded-full border border-ink/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-smoke uppercase">
            {course.level}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-smoke">{course.blurb}</p>
        <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-smoke">
          <span className="inline-flex items-center gap-1.5">
            <Video className="size-3.5" aria-hidden="true" />
            {course.lessonCount} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {course.durationLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

/** Illustrative creator storefront preview used on public marketing pages. */
export function CreatorShowcaseCard({
  creator,
  rotate = 0,
  className,
}: {
  creator: CreatorPublicProfile;
  rotate?: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        // w-full + min-w-0: the card must shrink to its grid track, never
        // size to its widest line of content. The playful tilt starts at
        // sm — on phones the card spans the full padded width, so rotated
        // corners + the hard shadow would paint past the screen edge.
        "relative flex w-full min-w-0 flex-col rounded-3xl border-2 border-ink bg-white p-5 shadow-hard sm:p-6",
        rotate === 1 ? "sm:rotate-1" : rotate === -1 ? "sm:-rotate-1" : undefined,
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-ink">
          <Image
            src={creator.avatarUrl}
            alt={`${creator.displayName} profile photo`}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">
            {creator.displayName}
          </h3>
          <p className="truncate text-sm font-semibold text-accent-deep">@{creator.handle}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-smoke">
            {creator.tagline}
          </p>
        </div>
      </div>

      {/*
        Uneven columns: counts are short, the niche ("Photography") is the
        long pole — equal thirds made it paint outside its cell on narrow
        cards. min-w-0 + truncate keep every value inside its cell.
      */}
      <div className="mt-4 grid grid-cols-[0.7fr_1fr_1.35fr] divide-x-2 divide-ink/10 rounded-2xl border-2 border-ink bg-parchment text-center">
        <div className="min-w-0 px-1 py-2.5">
          <p className="truncate text-base leading-none font-bold text-ink">
            {creator.stats.courseCount}
          </p>
          <p className="mt-1 truncate text-[10px] font-bold tracking-wider text-smoke uppercase">
            {creator.stats.courseCount === 1 ? "course" : "courses"}
          </p>
        </div>
        <div className="min-w-0 px-1 py-2.5">
          <p className="truncate text-base leading-none font-bold text-ink">
            {creator.stats.learnerCount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 truncate text-[10px] font-bold tracking-wider text-smoke uppercase">
            learners
          </p>
        </div>
        <div className="min-w-0 px-1 py-2.5">
          <p className="truncate text-base leading-none font-bold text-ink">{creator.niche}</p>
          <p className="mt-1 truncate text-[10px] font-bold tracking-wider text-smoke uppercase">
            niche
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-2.5">
        {creator.courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-cream p-2.5"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink">
              <Image
                src={course.coverUrl}
                alt={`${course.title} course cover`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{course.title}</p>
              <p className="truncate text-xs text-smoke">
                {course.lessonCount} lessons · {course.durationLabel}
              </p>
            </div>
            <span className="shrink-0 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-xs font-bold">
              {formatINR(course.priceInPaise)}
            </span>
          </div>
        ))}
      </div>

      <Button
        href="/signup"
        variant="outline"
        size="sm"
        className="mt-5 h-auto min-h-9 w-full py-1.5 text-center whitespace-normal"
      >
        Start a storefront like this
      </Button>
    </article>
  );
}

/**
 * Illustrative phone frame showing a storefront in the hero.
 * Purely decorative illustration — pointer events and AT exposure disabled.
 */
export function StorefrontPhoneMock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none w-full max-w-62 select-none rounded-[2.5rem] border-2 border-ink bg-white p-3 shadow-hard sm:max-w-72",
        className,
      )}
    >
      <div className="rounded-[2rem] border-2 border-ink bg-cream p-4">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-ink/15" />
        <div className="flex items-center gap-3">
          <div className="relative size-12 overflow-hidden rounded-full border-2 border-ink">
            <Image
              src="/images/avatars/meera.jpg"
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm leading-tight font-bold text-ink">Meera Kapoor</p>
            <p className="text-xs font-semibold text-accent-deep">@meera-shoots</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-smoke">
          Teaching 86k subscribers to shoot on film, not filters.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["YouTube", "Instagram", "Prints"].map((label) => (
            <span
              key={label}
              className="rounded-full border-2 border-ink bg-white px-2.5 py-1 text-[10px] font-bold text-ink"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border-2 border-ink bg-white p-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-ink">
            <Image
              src="/images/courses/photography.jpg"
              alt=""
              fill
              sizes="240px"
              className="object-cover"
            />
            <span className="absolute top-2 left-2 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[10px] font-bold">
              ₹1,499
            </span>
          </div>
          <p className="mt-2 px-1 text-xs font-bold text-ink">
            Film Photography Foundations
          </p>
          <p className="px-1 text-[10px] text-smoke">24 lessons · 4h 30m</p>
          <div className="mt-2 flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-accent py-2 text-[11px] font-bold text-cream">
            <Bell className="size-3" />
            Enrol now
          </div>
        </div>
        <p className="mt-3 text-center font-editorial text-xs text-smoke italic">
          beevo.in/@meera-shoots
        </p>
      </div>
    </div>
  );
}

