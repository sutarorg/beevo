import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CreatorAppShell } from "@/components/creator/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Creator Studio",
    template: "%s · CourseKit Studio",
  },
};

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return <CreatorAppShell>{children}</CreatorAppShell>;
}
