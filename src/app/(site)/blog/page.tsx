import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, BookOpen } from "lucide-react";
import { BLOG_ARTICLES, BLOG_SECTIONS, FEATURED_ARTICLE, categoryAnchor } from "@/content/blog";
import type { BlogCategory } from "@/lib/blog";
import { blogIndexJsonLd, createPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { FeaturedArticleCard, BlogCard } from "@/components/blog/cards";
import { CTASection } from "@/components/marketing/blocks";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

/**
 * /blog — the guide index.
 *
 * Server-rendered and fully static: every card, its image, its reading time
 * and its link ship in the initial HTML. Articles are grouped by topic with
 * the freshest topic first, and the anchor chips let a phone reader jump
 * without loading anything.
 */

const TITLE = "Selling courses, fees and audience growth";
const DESCRIPTION =
  "Practical guides for Indian creators: what Gumroad, Instamojo and Beevo really cost, how to price a course, and how to turn the audience you already have into buyers.";

export const metadata: Metadata = createPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/blog",
  keywords: [
    "sell online courses India",
    "creator guides",
    "Gumroad alternatives India",
    "course pricing India",
    "sell digital products India",
  ],
});

const SECTION_LEDES: Record<BlogCategory, string> = {
  Comparisons:
    "Platform against platform, with published fees and the places where we are the weaker option.",
  Pricing: "How fees, tiers and tax actually behave — and how to pick a number you can defend.",
  "Selling in India": "Rupee checkout, GST, receipts and delivery, without a website or a team.",
  "Launch playbooks": "Step-by-step plans for the first product, the first buyer, the first repeat.",
  Audience: "Turning attention on Instagram and WhatsApp into conversations that end in a sale.",
};

export default function BlogIndexPage() {
  const posts = BLOG_ARTICLES.map((article) => ({ slug: article.slug, title: article.title }));

  return (
    <>
      <JsonLd id="beevo-blog-structured-data" data={blogIndexJsonLd(posts, DESCRIPTION)} />

      <section className="relative overflow-hidden border-b-2 border-ink">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(213,243,78,0.35),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(232,73,15,0.18),transparent_40%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <Sticker color="accent">The Beevo blog</Sticker>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl">
            Sell what you{" "}
            <span className="font-editorial font-normal text-accent italic">know</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-smoke sm:text-lg">
            {DESCRIPTION}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/signup" variant="ink" size="lg">
              Start free
            </Button>
            <Button href="/pricing" variant="outline" size="lg">
              See the 8% plan
            </Button>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-smoke">
              <BookOpen className="size-4" aria-hidden="true" />
              {BLOG_ARTICLES.length} in-depth guides · no fluff, no fake stats
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <h2 id="featured-heading" className="sr-only">
          Start here
        </h2>
        <FeaturedArticleCard article={FEATURED_ARTICLE} />
      </section>

      <nav aria-label="Blog topics" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <p className="text-xs font-bold tracking-[0.22em] text-accent-deep uppercase">
          Jump to a topic
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {BLOG_SECTIONS.map((section) => (
            <li key={section.category}>
              <a
                href={`#${categoryAnchor(section.category)}`}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-xs font-bold text-ink shadow-hard-xs transition-transform hover:-translate-y-0.5"
              >
                {section.category}
                <span className="text-smoke">{section.articles.length}</span>
                <ArrowDown className="size-3 text-accent-deep" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {BLOG_SECTIONS.map((section) => (
          <section
            key={section.category}
            id={categoryAnchor(section.category)}
            aria-labelledby={`${categoryAnchor(section.category)}-heading`}
            className="scroll-mt-24 border-t-2 border-ink/10 pt-10 pb-4 first-of-type:mt-10"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id={`${categoryAnchor(section.category)}-heading`}
                  className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                >
                  {section.category}
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-smoke">
                  {SECTION_LEDES[section.category]}
                </p>
              </div>
              <p className="text-xs font-semibold text-smoke">
                {section.articles.length} guide{section.articles.length === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="mt-6 grid gap-6 pb-8 sm:grid-cols-2 lg:grid-cols-3">
              {section.articles.map((article) => (
                <li key={article.slug} className="min-w-0">
                  <BlogCard article={article} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="rounded-3xl border-2 border-ink bg-parchment p-6 sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            How we write these guides
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <p className="text-sm leading-relaxed text-smoke">
              <strong className="font-bold text-ink">Numbers come from the source.</strong> Every
              competitor fee is quoted from its own pricing page, with the date it was checked.
            </p>
            <p className="text-sm leading-relaxed text-smoke">
              <strong className="font-bold text-ink">No invented proof.</strong> No made-up
              testimonials, no earnings screenshots, no “creators earn ₹X” claims.
            </p>
            <p className="text-sm leading-relaxed text-smoke">
              <strong className="font-bold text-ink">Our bias is declared.</strong> We build Beevo,
              so comparisons say so — and include what Beevo cannot do.
            </p>
          </div>
          <p className="mt-4 text-sm text-smoke">
            Something out of date? Tell us at{" "}
            <Link
              href="mailto:support@beevo.in"
              className="font-semibold text-accent-deeper underline decoration-2 decoration-accent-deeper/40 underline-offset-2"
            >
              support@beevo.in
            </Link>{" "}
            and we will check the source page again.
          </p>
        </div>
      </section>

      <CTASection
        title="Reading is free. Selling is 8%."
        body="Turn what you just read into a storefront: publish a course tonight, share one link tomorrow, and keep 92% of every successful eligible sale."
      />
    </>
  );
}
