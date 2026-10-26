import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Clock3 } from "lucide-react";
import { getBlogArticle, getBlogSlugs, getRelatedArticles } from "@/content/blog";
import {
  BLOG_AUTHOR,
  formatPostDate,
  readingTimeMinutes,
  resolveArticleBlocks,
} from "@/lib/blog";
import {
  absoluteUrl,
  articleJsonLd,
  breadcrumbJsonLd,
  createPageMetadata,
  ORGANIZATION_ID,
  schemaGraph,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleBody, KeyTakeaways, SourceList } from "@/components/blog/article-body";
import { BlogCard } from "@/components/blog/cards";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareRow } from "@/components/blog/share";
import { TableOfContents } from "@/components/blog/toc";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

/**
 * /blog/[slug] — a single guide.
 *
 * Fully server-rendered and statically generated: the headline, body, table of
 * contents, tables, FAQ and structured data are all in the initial HTML, so a
 * crawler and a phone on a slow connection get the same complete page. The
 * only client JavaScript is the share row, the fee calculator (when an article
 * includes one) and the decorative progress bar.
 */

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

function findArticle(slug: string) {
  const article = getBlogArticle(slug);
  if (!article) notFound();
  return article;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(slug);
  const path = `/blog/${article.slug}`;

  return createPageMetadata({
    title: article.seoTitle ?? article.title,
    description: article.description,
    path,
    type: "article",
    images: [
      {
        url: article.image.src,
        width: article.image.width,
        height: article.image.height,
        alt: article.image.alt,
      },
    ],
    keywords: [...article.tags, "Beevo blog", article.category],
    article: {
      publishedTime: `${article.publishedAt}T00:00:00.000Z`,
      ...(article.updatedAt ? { modifiedTime: `${article.updatedAt}T00:00:00.000Z` } : {}),
      authors: [BLOG_AUTHOR.name],
      section: article.category,
      tags: article.tags,
    },
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = findArticle(slug);
  const { blocks, toc } = resolveArticleBlocks(article);
  const minutes = readingTimeMinutes(article);
  const url = absoluteUrl(`/blog/${article.slug}`);
  const blogUrl = absoluteUrl("/blog");

  const faqItems = blocks.flatMap((block) => (block.type === "faq" ? block.items : []));
  const related = getRelatedArticles(article, 3);

  return (
    <>
      <ReadingProgress />
      <JsonLd
        id="blog-article-structured-data"
        data={articleJsonLd({
          url,
          title: article.title,
          description: article.description,
          image: {
            url: article.image.src,
            width: article.image.width,
            height: article.image.height,
          },
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          section: article.category,
          tags: article.tags,
        })}
      />
      <JsonLd
        id="blog-breadcrumb-structured-data"
        data={breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: "Blog", url: blogUrl },
          { name: article.title, url },
        ])}
      />
      {faqItems.length > 0 ? (
        <JsonLd
          id="blog-faq-structured-data"
          data={schemaGraph([
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              url,
              name: `${article.title} — frequently asked questions`,
              inLanguage: "en-IN",
              isPartOf: { "@id": ORGANIZATION_ID },
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            },
          ])}
        />
      ) : null}

      <article className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <nav aria-label="Breadcrumb" className="pt-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-smoke">
            <li>
              <Link href="/" className="hover:text-accent-deep">
                Home
              </Link>
            </li>
            <ChevronRight className="size-3 text-smoke/60" aria-hidden="true" />
            <li>
              <Link href="/blog" className="hover:text-accent-deep">
                Blog
              </Link>
            </li>
            <ChevronRight className="size-3 text-smoke/60" aria-hidden="true" />
            <li aria-current="page" className="max-w-[14rem] truncate text-ink sm:max-w-md">
              {article.title}
            </li>
          </ol>
        </nav>

        <header className="mx-auto mt-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Sticker color="accent">{article.category}</Sticker>
            {article.updatedAt ? (
              <span className="text-[11px] font-bold tracking-[0.14em] text-smoke uppercase">
                Updated {formatPostDate(article.updatedAt)}
              </span>
            ) : null}
          </div>
          <h1 className="mt-5 text-3xl leading-[1.1] font-bold tracking-tight text-balance text-ink sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-pretty text-smoke sm:text-lg">
            {article.description}
          </p>

          <div className="mt-6 flex flex-col gap-4 border-t-2 border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime font-editorial text-lg text-ink italic"
              >
                B
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{BLOG_AUTHOR.name}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-smoke">
                  <time dateTime={article.publishedAt}>
                    {formatPostDate(article.publishedAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {minutes} min read
                  </span>
                </p>
              </div>
            </div>
            <ShareRow url={url} title={article.title} />
          </div>
        </header>

        <figure className="mx-auto mt-8 max-w-5xl">
          <div className="relative aspect-video overflow-hidden rounded-3xl border-2 border-ink bg-parchment shadow-hard-sm">
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              preload
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </figure>

        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            <TableOfContents entries={toc} variant="inline" />
            <div className="mb-8">
              <KeyTakeaways items={article.takeaways} />
            </div>

            <ArticleBody blocks={blocks} />

            {article.sources ? <SourceList sources={article.sources} /> : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink bg-white p-4 shadow-hard-xs">
              <ShareRow url={url} title={article.title} />
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:text-accent-deep"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                All guides
              </Link>
            </div>

            <aside
              aria-labelledby="author-heading"
              className="mt-8 rounded-3xl border-2 border-ink bg-parchment p-5 sm:p-6"
            >
              <h2
                id="author-heading"
                className="text-xs font-bold tracking-[0.22em] text-accent-deeper uppercase"
              >
                Written by
              </h2>
              <p className="mt-2 text-lg font-bold text-ink">{BLOG_AUTHOR.name}</p>
              <p className="text-sm font-semibold text-smoke">{BLOG_AUTHOR.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{BLOG_AUTHOR.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href="/blog" variant="outline" size="sm">
                  More guides
                </Button>
                <Button href="/signup" variant="ink" size="sm">
                  Start free
                </Button>
              </div>
            </aside>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <TableOfContents entries={toc} variant="sidebar" />
              <div className="rounded-2xl border-2 border-ink bg-ink p-5 text-cream">
                <p className="text-xs font-bold tracking-[0.18em] text-lime uppercase">
                  Free plan · ₹0/month
                </p>
                <p className="mt-2 text-sm leading-relaxed text-cream/80">
                  Publish a course and share one link. We take 8% only when you make a successful
                  eligible sale.
                </p>
                <Button href="/signup" variant="lime" size="sm" className="mt-4 w-full">
                  Start free
                </Button>
              </div>
            </div>
          </aside>
        </div>

        <section aria-labelledby="related-heading" className="mx-auto mt-16 max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t-2 border-ink/10 pt-8">
            <h2 id="related-heading" className="text-2xl font-bold tracking-tight text-ink">
              Keep reading
            </h2>
            <Link
              href="/blog"
              className="text-sm font-bold text-accent-deep underline decoration-2 decoration-accent-deep/40 underline-offset-2"
            >
              All guides
            </Link>
          </div>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug} className="min-w-0">
                <BlogCard article={item} />
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
