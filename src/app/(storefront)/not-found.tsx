import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

/**
 * Storefront 404 — rendered for an unknown creator handle, an unpublished or
 * archived course, or a malformed storefront URL. Next returns a real HTTP 404
 * status for this boundary, so Google removes dead storefront links instead of
 * keeping them as "soft 404" pages.
 */
export const metadata: Metadata = {
  title: "This page isn’t available",
  description:
    "This creator storefront or course link isn’t available. It may be mistyped, unpublished, or archived.",
  robots: { index: false, follow: false },
};

export default function StorefrontNotFound() {
  return (
    <section className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-[2.5rem] border-2 border-ink bg-white p-8 text-center shadow-hard sm:p-12">
        <Sticker color="accent">Not available</Sticker>
        <p className="mt-8 font-editorial text-6xl italic">Wrong shelf.</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          This page isn’t available
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          The link may be mistyped, or the creator unpublished this course. Only published
          storefronts and courses are public.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/" variant="ink" size="sm">
            Go to Beevo
          </Button>
          <Button href="/signup" variant="outline" size="sm">
            Start your own storefront
          </Button>
        </div>
        <p className="mt-6 text-xs text-smoke">
          Looking for the main site?{" "}
          <Link href="/features" className="font-semibold text-accent-deep underline underline-offset-2">
            See what Beevo does
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
