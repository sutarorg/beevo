import type { Metadata } from "next";
import { CTASection } from "@/components/marketing/blocks";
import {
  BenefitsSection,
  CreateLearnSection,
  FaqPreviewSection,
  HeroSection,
  HowItWorksSection,
  NotMarketplaceSection,
  PricingPreviewSection,
  ShowcaseSection,
  TickerSection,
} from "@/components/marketing/home-sections";
import { JsonLd } from "@/components/seo/json-ld";
import {
  createPageMetadata,
  schemaGraph,
  SITE_DESCRIPTION,
  softwareApplicationNode,
} from "@/lib/seo";

/**
 * Homepage metadata is explicit (not inherited) so the title, description,
 * canonical, Open Graph and Twitter card remain consistent.
 */
export const metadata: Metadata = createPageMetadata({
  title: "Create & Sell Online Courses in India | Beevo",
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: "/",
  keywords: [
    "sell courses online",
    "creator storefront",
    "online course platform India",
    "sell courses to your audience",
    "course selling website",
  ],
});

export default function HomePage() {
  return (
    <>
      <JsonLd id="beevo-home-structured-data" data={schemaGraph([softwareApplicationNode()])} />
      <HeroSection />
      <TickerSection />
      <BenefitsSection />
      <NotMarketplaceSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <CreateLearnSection />
      <PricingPreviewSection />
      <FaqPreviewSection />
      <CTASection />
    </>
  );
}
