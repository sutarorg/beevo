import type { Metadata } from "next";
import {
  PURCHASE_POLICY_SECTIONS,
  REFUND_SECTIONS,
  type LegalSection,
} from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = createPageMetadata({
  title: "Course purchase & refund policy",
  description:
    "Course purchases on Beevo are non-refundable once access is granted, except where a refund or other remedy is required by applicable law.",
  path: "/refund-policy",
});

function stripNumber(heading: string): string {
  return heading.replace(/^\d+\.\s*/, "");
}

const sections: LegalSection[] = [
  ...PURCHASE_POLICY_SECTIONS.map((section) => ({
    ...section,
    id: `purchase-${section.id}`,
    heading: `Purchase policy — ${stripNumber(section.heading)}`,
  })),
  ...REFUND_SECTIONS.map((section) => ({
    ...section,
    id: `refund-${section.id}`,
    heading: `Refund policy — ${stripNumber(section.heading)}`,
  })),
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Course Purchase & Refund Policy"
      intro="Course purchases are digital goods delivered immediately. They are non-refundable once access is granted — except where applicable law requires a refund or other remedy. Those mandatory rights are always preserved."
      sections={sections}
      currentPath="/refund-policy"
    />
  );
}
