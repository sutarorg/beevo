import { ArrowRight, Check, ExternalLink, Info, Lightbulb, Quote, TriangleAlert } from "lucide-react";
import type { ResolvedBlock } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { FeeCalculator } from "@/components/blog/fee-calculator";
import { InlineText } from "@/components/blog/inline-text";

/**
 * Renders article blocks.
 *
 * Every element is chosen for meaning, not looks: headings keep the document
 * outline intact (h2/h3 only — the article's single h1 is in the page header),
 * tables are real tables with scoped headers, and callouts are labelled
 * regions rather than decorated divs.
 */

function Callout({
  tone = "lime",
  title,
  text,
}: {
  tone?: "lime" | "accent" | "ink";
  title?: string;
  text: string;
}) {
  const tones = {
    lime: {
      box: "border-ink bg-lime/25",
      icon: "bg-lime text-ink",
      Icon: Lightbulb,
    },
    accent: {
      box: "border-ink bg-accent/10",
      icon: "bg-accent text-cream",
      Icon: TriangleAlert,
    },
    ink: {
      box: "border-ink bg-ink text-cream",
      icon: "bg-lime text-ink",
      Icon: Info,
    },
  } as const;
  const { box, icon, Icon } = tones[tone];
  return (
    <aside className={`my-8 rounded-3xl border-2 p-5 shadow-hard-xs sm:p-6 ${box}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink ${icon}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          {title ? (
            <p className={`text-sm font-bold tracking-tight ${tone === "ink" ? "text-lime" : "text-ink"}`}>
              {title}
            </p>
          ) : null}
          <p
            className={`text-sm leading-relaxed ${tone === "ink" ? "text-cream/80" : "text-ink/85"} ${title ? "mt-1" : ""}`}
          >
            <InlineText text={text} />
          </p>
        </div>
      </div>
    </aside>
  );
}

function DataTable({
  caption,
  head,
  rows,
  note,
}: {
  caption?: string;
  head: string[];
  rows: string[][];
  note?: string;
}) {
  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-2xl border-2 border-ink bg-white shadow-hard-xs">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          {caption ? (
            <caption className="border-b-2 border-ink bg-parchment px-4 py-3 text-left text-xs font-bold tracking-[0.12em] text-ink uppercase">
              {caption}
            </caption>
          ) : null}
          <thead>
            <tr className="bg-ink text-cream">
              {head.map((cell) => (
                <th
                  key={cell || "blank"}
                  scope="col"
                  className="px-4 py-3 text-xs font-bold tracking-[0.08em] uppercase"
                >
                  {cell || <span className="sr-only">Column</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink/10">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-cream/60" : undefined}>
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th
                      key={cellIndex}
                      scope="row"
                      className="px-4 py-3 align-top text-sm font-semibold text-ink"
                    >
                      <InlineText text={cell} />
                    </th>
                  ) : (
                    <td key={cellIndex} className="px-4 py-3 align-top text-sm text-smoke">
                      <InlineText text={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? (
        <figcaption className="mt-2 text-xs leading-relaxed text-smoke">
          <InlineText text={note} />
        </figcaption>
      ) : null}
    </figure>
  );
}

function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section aria-labelledby="faq" className="my-10 scroll-mt-24">
      <h2
        id="faq"
        className="text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl"
      >
        Frequently asked questions
      </h2>
      <div className="mt-4 divide-y-2 divide-ink/10 rounded-3xl border-2 border-ink bg-white px-5 shadow-hard-xs sm:px-7">
        {items.map((item) => (
          <div key={item.q} className="py-5">
            <h3 className="text-base font-bold tracking-tight text-ink sm:text-lg">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke sm:text-base">
              <InlineText text={item.a} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ArticleBody({ blocks }: { blocks: ResolvedBlock[] }) {
  return (
    <div className="text-[1.0625rem] leading-relaxed text-ink/90">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={block.id}
                id={block.id}
                className="mt-12 mb-4 scroll-mt-24 text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl"
              >
                <InlineText text={block.text} />
              </h2>
            );
          case "h3":
            return (
              <h3
                key={block.id}
                id={block.id}
                className="mt-8 mb-3 scroll-mt-24 text-lg font-bold tracking-tight text-ink sm:text-xl"
              >
                <InlineText text={block.text} />
              </h3>
            );
          case "p":
            return (
              <p key={index} className="my-4 text-pretty">
                <InlineText text={block.text} />
              </p>
            );
          case "ul":
            return (
              <ul key={index} className="my-5 space-y-2.5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 inline-block size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span className="min-w-0 text-pretty">
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index} className="my-5 space-y-3">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-parchment text-xs font-bold text-ink"
                    >
                      {itemIndex + 1}
                    </span>
                    <span className="min-w-0 text-pretty">
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <figure key={index} className="my-8 border-l-4 border-accent-deep pl-5 sm:pl-6">
                <Quote className="size-5 text-accent-deep" aria-hidden="true" />
                <blockquote className="mt-2 font-editorial text-xl leading-snug text-ink italic sm:text-2xl">
                  {block.text}
                </blockquote>
                {block.attribution ? (
                  <figcaption className="mt-2 text-xs font-bold tracking-[0.12em] text-smoke uppercase">
                    {block.attribution}
                  </figcaption>
                ) : null}
              </figure>
            );
          case "callout":
            return (
              <Callout key={index} tone={block.tone} title={block.title} text={block.text} />
            );
          case "table":
            return (
              <DataTable
                key={index}
                caption={block.caption}
                head={block.head}
                rows={block.rows}
                note={block.note}
              />
            );
          case "cta":
            return (
              <aside
                key={index}
                className="my-10 rounded-[2rem] border-2 border-ink bg-ink px-6 py-8 text-cream shadow-hard-accent sm:px-8"
              >
                <p className="text-xs font-bold tracking-[0.22em] text-lime uppercase">
                  Free plan · 8% only when you sell
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  {block.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">
                  {block.body}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button href={block.href ?? "/signup"} variant="lime">
                    {block.label ?? "Start free"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                  <Button href="/how-it-works" variant="outline-cream">
                    See how it works
                  </Button>
                </div>
              </aside>
            );
          case "widget":
            return block.widget === "fee-calculator" ? <FeeCalculator key={index} /> : null;
          case "faq":
            return <FaqList key={index} items={block.items} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

/** The "short version" summary rendered above the body. */
export function KeyTakeaways({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <aside
      aria-labelledby="takeaways-heading"
      className="rounded-3xl border-2 border-ink bg-lime/25 p-5 shadow-hard-xs sm:p-6"
    >
      <h2
        id="takeaways-heading"
        className="text-xs font-bold tracking-[0.22em] text-accent-deeper uppercase"
      >
        The short version
      </h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-white">
              <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
            </span>
            <span className="text-pretty">
              <InlineText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Verifiability footer: where each borrowed figure came from, and when. */
export function SourceList({
  sources,
}: {
  sources: { label: string; url: string; checked: string }[];
}) {
  if (sources.length === 0) return null;
  return (
    <section
      aria-labelledby="sources-heading"
      className="mt-12 rounded-2xl border-2 border-ink/15 bg-parchment/60 p-5"
    >
      <h2 id="sources-heading" className="text-xs font-bold tracking-[0.22em] text-smoke uppercase">
        Sources, and when they were checked
      </h2>
      <ul className="mt-3 space-y-2">
        {sources.map((source) => (
          <li key={source.url} className="flex items-start gap-2 text-sm">
            <ExternalLink className="mt-1 size-3.5 shrink-0 text-smoke" aria-hidden="true" />
            <span className="min-w-0">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink underline decoration-ink/25 underline-offset-2 hover:decoration-ink"
              >
                {source.label}
              </a>
              <span className="text-smoke">
                {" — checked "}
                {new Date(`${source.checked}T00:00:00Z`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-smoke">
        Competitor pricing changes without notice. If a number here is out of date, the linked
        page is the authority — not this article.
      </p>
    </section>
  );
}
