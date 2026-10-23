import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LearnerShell } from "@/components/learner/app-shell";

export const metadata: Metadata = {
  title: {
    default: "My Learning",
    template: "%s · Beevo Learn",
  },
};

export default function LearnLayout({ children }: { children: ReactNode }) {
  return <LearnerShell>{children}</LearnerShell>;
}
