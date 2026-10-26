import { ArrowRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY_STYLES, formatPostDate, readingTimeMinutes, type BlogArticle } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { Sticker } from "@/components/ui/primitives";

/**
 * Blog cards.
 *
 * The whole card is the link (not a "read more" afterthought), the image has
 * descriptive alt text written per article, and the meta line carries the
 * published date and honest reading time. Sizes are tuned so a phone never
 * downloads a desktop-sized thumbnail.
 */

function Meta({ article, className }: { article: BlogArticle; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-smoke", className)}>
      <time dateTime={article.publishedAt}>{formatPostDate(article.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Clock3 className="size-3.5" aria-hidden="true" />
        {readingTimeMinutes(article)} min read
      </span>
    </p>
  );
}

export function BlogCard({
  article,
  priority = false,
  className,
}: {
  article: BlogArticle;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-hard-xs transition-transform duration-200 hover:-translate-y-1",
        className,
      )}
    >
      <Link
        href={`/blog/${article.slug}`}
        className="flex h-full flex-col focus-visible:outline-offset-4"
      >
        <div className="relative aspect-video border-b-2 border-ink bg-parchment">
          <Image
            src={article.image.src}
            alt={article.image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-[11px] font-bold tracking-[0.16em] text-accent-deep uppercase">
            {article.category}
          </p>
          <h3 className="mt-2 text-lg leading-snug font-bold tracking-tight text-balance text-ink group-hover:text-accent-deep">
            {article.title}
          </h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-smoke">
            {article.excerpt ?? article.description}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Meta article={article} />
            <ArrowRight
              className="size-4 shrink-0 text-accent-deep transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}

export function FeaturedArticleCard({ article }: { article: BlogArticle }) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border-2 border-ink bg-white shadow-hard-sm transition-transform duration-200 hover:-translate-y-1">
      <Link
        href={`/blog/${article.slug}`}
        className="grid gap-0 lg:grid-cols-[1.15fr_1fr]"
      >
        <div className="relative aspect-video border-b-2 border-ink bg-parchment lg:aspect-auto lg:min-h-[22rem] lg:border-r-2 lg:border-b-0">
          <Image
            src={article.image.src}
            alt={article.image.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            preload
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Sticker color={CATEGORY_STYLES[article.category].sticker} className="shadow-none">
              {article.category}
            </Sticker>
            <span className="text-[11px] font-bold tracking-[0.16em] text-smoke uppercase">
              Latest guide
            </span>
          </div>
          <h2 className="mt-4 text-2xl leading-tight font-bold tracking-tight text-balance text-ink group-hover:text-accent-deep sm:text-3xl lg:text-4xl">
            {article.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-smoke sm:text-base">
            {article.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Meta article={article} />
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-deep">
              Read the guide
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
