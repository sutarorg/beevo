import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LearnerShell } from "@/components/learner/app-shell";

/**
 * The learner dashboard holds purchased content and account data. It is
 * authenticated and private, so no route under /learn is indexable.
 */
export const metadata: Metadata = {
  title: {
    default: "My Learning",
    template: "%s · Beevo Learn",
  },
  description:
    "Beevo My Learning — your private learner dashboard with purchased courses, progress, and receipts.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function LearnLayout({ children }: { children: ReactNode }) {
  return <LearnerShell>{children}</LearnerShell>;
}
