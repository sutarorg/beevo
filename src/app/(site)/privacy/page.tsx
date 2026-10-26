import type { Metadata } from "next";
import { PRIVACY_SECTIONS } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "What data Beevo collects, why, how it is used, which providers we rely on, and the rights you have over your information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect, why we collect it, who processes it on our behalf, and the control you have over your data."
      sections={PRIVACY_SECTIONS}
      currentPath="/privacy"
    />
  );
}
