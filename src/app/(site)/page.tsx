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
import { APP_NAME } from "@/lib/config";
import {
  createPageMetadata,
  schemaGraph,
  SITE_DESCRIPTION,
  softwareApplicationNode,
} from "@/lib/seo";

/**
 * Homepage metadata is explicit (not inherited) so the title, description,
 * canonical, Open Graph and Twitter card all agree with the visible hero and
 * with the homepage-only SoftwareApplication structured data.
 */
export const metadata: Metadata = createPageMetadata({
  title: `${APP_NAME} — Sell courses to your own audience`,
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
