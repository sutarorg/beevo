import type { Metadata } from "next";
import { TERMS_SECTIONS } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  description:
    "The terms that govern Beevo accounts, creator content, the 8% commission, payouts, and acceptable use of the platform.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules of the platform: what Beevo provides, what creators and learners agree to, and how money and content are handled."
      sections={TERMS_SECTIONS}
      currentPath="/terms"
    />
  );
}
