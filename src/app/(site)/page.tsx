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

export default function HomePage() {
  return (
    <>
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
