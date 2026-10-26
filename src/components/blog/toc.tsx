import { List } from "lucide-react";
import type { TocEntry } from "@/lib/blog";

/**
 * Table of contents for an article.
 *
 * Rendered as a native <details> on phones (zero JavaScript, keyboard
 * accessible) and as a sticky rail on large screens. Links are plain anchor
 * navigation, so a reader — or a crawler — can jump straight to a section.
 */
export function TableOfContents({
  entries,
  variant = "inline",
}: {
  entries: TocEntry[];
  /**
   * "inline" renders the collapsible phone version inside the article column;
   * "sidebar" renders the sticky rail for large screens. Rendering both in one
   * call would duplicate the same navigation landmark on desktop.
   */
  variant?: "inline" | "sidebar";
}) {
  if (entries.length < 3) return null;

  const list = (
    <ol className="space-y-1.5 text-sm">
      {entries.map((entry) => (
        <li key={entry.id} className={entry.level === 3 ? "pl-4" : undefined}>
          <a
            href={`#${entry.id}`}
            className="block rounded-md py-1 text-smoke transition-colors hover:text-accent-deep focus-visible:text-accent-deep"
          >
            {entry.title}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "inline") {
    return (
      <details className="mb-8 rounded-2xl border-2 border-ink bg-white px-4 py-3 shadow-hard-xs lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-ink">
          <List className="size-4 text-accent-deep" aria-hidden="true" />
          On this page
        </summary>
        <nav aria-label="On this page" className="mt-3 border-t-2 border-ink/10 pt-3">
          {list}
        </nav>
      </details>
    );
  }

  return (
    <nav
      aria-label="On this page"
      className="rounded-2xl border-2 border-ink bg-white p-5 shadow-hard-xs"
    >
      <p className="text-xs font-bold tracking-[0.2em] text-accent-deep uppercase">On this page</p>
      <div className="mt-3 max-h-[70vh] overflow-y-auto pr-1">{list}</div>
    </nav>
  );
}
