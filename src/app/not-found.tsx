import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, House, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

/**
 * The 404 for the whole app.
 *
 * Deliberately a single, self-contained page rather than one per route group:
 * Next.js resolves `not-found.tsx` files from sibling route groups in a way
 * that made a storefront-shaped 404 appear for marketing URLs. One honest 404
 * that links to the blog, the homepage and the guides beats several
 * unpredictable ones.
 *
 * Next answers with a real HTTP 404 status, so dead links are dropped from the
 * index; `noindex` keeps a mistyped URL out of it even when linked directly.
 */
export const metadata: Metadata = {
  title: "Page not found",
  description:
    "That page isn’t here. Browse the Beevo guides or head back to the homepage to see how creators sell courses to their own audience.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="grid min-h-dvh place-items-center bg-cream px-4 py-16"
    >
      <div className="w-full max-w-lg rounded-[2.5rem] border-2 border-ink bg-white p-8 text-center shadow-hard sm:p-12">
        <Sticker color="accent">Error 404</Sticker>
        <p className="mt-8 font-editorial text-7xl italic">Lost the plot.</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          This page doesn’t exist
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          The link may be old, mistyped, or the page moved. Happens to the best
          of us — even creators with great links.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/blog" variant="ink">
            <BookOpen className="size-4" aria-hidden="true" />
            Read the guides
          </Button>
          <Button href="/" variant="outline">
            <House className="size-4" aria-hidden="true" />
            Back home
          </Button>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-smoke">
          Looking for a creator’s storefront? Those live at{" "}
          <span className="font-semibold text-ink">beevo.in/@their-handle</span>.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1 text-accent-deep underline decoration-2 decoration-accent-deep/40 underline-offset-2"
          >
            <Map className="size-3.5" aria-hidden="true" />
            How it works
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-accent-deep underline decoration-2 decoration-accent-deep/40 underline-offset-2"
          >
            ₹0/month plan
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
