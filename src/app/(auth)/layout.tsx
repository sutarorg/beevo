import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/site/chrome";
import { DemoBadge } from "@/components/states";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col bg-parchment">
      <div className="border-b-2 border-ink bg-cream">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-accent"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-md flex-col items-stretch">{children}</div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <DemoBadge />
          <p className="max-w-md text-center text-xs text-smoke">
            By continuing you agree to our{" "}
            <Link href="/terms" className="font-semibold underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/refund-policy" className="font-semibold underline underline-offset-2">
              Refund Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
