import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BeevoLogo } from "@/components/brand/BeevoLogo";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#FFFEFB] via-[#FFFEFB] to-[#FFF9E9]/70">
      <header className="border-b border-beevo-border/60 bg-[#FFFEFB]/95 backdrop-blur-md">
        <div className="beevo-container flex h-[64px] items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Beevo — Home"
            className="inline-flex min-h-[44px] items-center rounded-lg pr-2"
          >
            <BeevoLogo variant="horizontal" iconSize={25} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden min-h-[44px] items-center rounded-lg px-3 text-[13px] font-semibold text-beevo-muted transition-colors hover:text-beevo-ink sm:inline-flex"
            >
              Studio Workspace
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-beevo-border bg-white px-4 text-[13px] font-semibold text-beevo-ink transition-colors hover:bg-beevo-cream"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Website
            </Link>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 md:py-14"
      >
        <div className="w-full max-w-[448px]">{children}</div>
      </main>

      <footer className="border-t border-beevo-border/60 bg-[#FFFEFB]/80 py-5">
        <div className="beevo-container flex flex-col items-center justify-between gap-3 text-[12.5px] text-beevo-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Beevo. All rights reserved.</p>
          <nav aria-label="Legal links" className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="inline-flex min-h-[44px] items-center hover:text-beevo-ink"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-[44px] items-center hover:text-beevo-ink"
            >
              Terms
            </Link>
            <Link
              href="/refund-policy"
              className="inline-flex min-h-[44px] items-center hover:text-beevo-ink"
            >
              Refund Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
