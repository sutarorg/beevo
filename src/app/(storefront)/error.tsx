"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

/**
 * Storefront error boundary.
 *
 * Temporary failures (database unavailable, scheduled maintenance) surface as
 * a server error, never as a 200 "not found" page — search engines treat a
 * 5xx as a temporary problem and keep the URL rather than dropping it.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront] render failed:", error.message);
  }, [error]);

  return (
    <section className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-[2.5rem] border-2 border-ink bg-white p-8 text-center shadow-hard sm:p-12">
        <Sticker color="accent">Temporarily unavailable</Sticker>
        <p className="mt-8 font-editorial text-5xl italic">Hold that thought.</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          This storefront couldn’t load
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          We hit a temporary problem loading this page. Nothing was charged and the link is
          still valid — try again in a moment.
        </p>
        <div className="mt-8">
          <Button onClick={reset} variant="ink" size="sm">
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      </div>
    </section>
  );
}
