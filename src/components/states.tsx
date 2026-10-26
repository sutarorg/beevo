"use client";

import {
  Construction,
  House,
  LifeBuoy,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SUPPORT_EMAIL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/primitives";

/**
 * Full-screen loading overlay for blocking application states, such as
 * session verification and actions that must finish before another screen
 * appears. Route transitions deliberately do not render this overlay, so the
 * current page stays visible until the destination is ready. The viewport-fixed
 * overlay keeps the spinner at the exact horizontal and vertical centre of
 * the website. The branded tile matches the site's card language (border-2,
 * rounded-3xl, hard shadow); the label uses the same tracked uppercase style.
 */
export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-cream text-ink"
    >
      <span className="grid size-16 place-items-center rounded-3xl border-2 border-ink bg-white shadow-hard-sm">
        <Spinner className="size-8 text-accent" />
      </span>
      <p className="text-sm font-semibold tracking-[0.18em] uppercase">{label}</p>
    </div>
  );
}

/** Route error boundary UI. */
export function ErrorPanel({
  title = "Something broke on our side",
  message = "The page hit an unexpected error. Nothing you entered was saved.",
  reset,
}: {
  title?: string;
  message?: string;
  reset?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="grid size-16 place-items-center rounded-2xl border-2 border-ink bg-accent text-cream shadow-hard-sm">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-smoke">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => (reset ? reset() : router.refresh())}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Button variant="outline" href="/">
          <House className="size-4" aria-hidden="true" />
          Back home
        </Button>
      </div>
    </div>
  );
}

/**
 * Shown when a configured service isn't wired yet (e.g. auth without the
 * backend). Explicit and honest — never fake a success.
 */
export function UnavailablePanel({
  title = "Not connected yet",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-ink bg-parchment p-6 shadow-hard-sm sm:p-8">
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime">
          <Construction className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-smoke">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button size="sm" variant="outline" href="/">
              Back home
            </Button>
            <Button size="sm" variant="ink" href={`mailto:${SUPPORT_EMAIL}`}>
              <LifeBuoy className="size-4" aria-hidden="true" />
              Contact support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
