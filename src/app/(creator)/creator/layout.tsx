import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CreatorAppShell } from "@/components/creator/app-shell";

/**
 * The creator studio is private, authenticated tooling. It must never appear
 * in search results; `noindex` is declared at the layout so every current and
 * future studio route inherits it.
 */
export const metadata: Metadata = {
  title: {
    default: "Creator Studio",
    template: "%s · Beevo Studio",
  },
  description:
    "Beevo Creator Studio — a private workspace for your profile, courses, learners, orders, and earnings.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return <CreatorAppShell>{children}</CreatorAppShell>;
}
