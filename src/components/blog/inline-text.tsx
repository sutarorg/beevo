import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Minimal inline formatting for article copy: **bold**, `code` and
 * [links](/pricing). Handled here rather than with a Markdown pipeline
 * because the copy is authored in TypeScript — no HTML is ever injected, and
 * every node is a real React element, so there is no sanitisation surface.
 */
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

export function InlineText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter((part) => part.length > 0);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-bold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded-md border border-ink/15 bg-parchment px-1.5 py-0.5 text-[0.9em] text-ink"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        const link = LINK.exec(part);
        if (link) {
          const [, label, href] = link;
          const internal = href.startsWith("/");
          const className =
            "font-semibold text-accent-deep underline decoration-2 decoration-accent-deep/40 underline-offset-2 transition-colors hover:decoration-accent-deep";
          if (internal) {
            return (
              <Link key={index} href={href} className={className}>
                {label}
              </Link>
            );
          }
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {label}
            </a>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

/** Strip inline markup — used for meta descriptions and heading anchors. */
export function plainText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export type { ReactNode };
