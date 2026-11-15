import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BeevoLogo } from "@/components/brand/BeevoLogo";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Log In to Beevo Studio",
  description: "Sign in to access your Beevo projects, credit balance, and MP4 downloads.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <section className="bg-beevo-canvas py-14 md:py-20">
      <div className="beevo-container">
        <div className="mx-auto max-w-md rounded-[22px] border border-beevo-border bg-white p-7 shadow-beevo sm:p-9">
          <div className="flex flex-col items-center text-center">
            <BeevoLogo variant="horizontal" iconSize={26} />
            <div className="mt-4">
              <Eyebrow>Beevo Studio Access</Eyebrow>
            </div>
            <h1 className="mt-3 font-display text-[24px] font-extrabold tracking-[-0.03em] text-beevo-ink">
              Sign in to your account
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-beevo-muted">
              Beevo authentication and private project workspaces connect in Phase 2 of platform
              rollout. This public marketing preview keeps private application routes separate and
              non-indexed.
            </p>
          </div>

          <div className="mt-6 rounded-[14px] border border-beevo-border-warm bg-beevo-cream/65 p-4 text-[13px] leading-relaxed text-beevo-body">
            <div className="flex items-center gap-2 font-bold text-beevo-ink">
              <Lock className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
              Public Marketing Site (Phase 1)
            </div>
            <p className="mt-1">
              Explore pricing, workflow architecture, or reach out through our Contact page while
              Studio sign-in is being wired up.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link href="/pricing" className="beevo-btn-primary min-h-[46px] w-full text-[14px]">
              View Credit Packs
            </Link>
            <Link href="/" className="beevo-btn-secondary min-h-[46px] w-full text-[14px]">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
