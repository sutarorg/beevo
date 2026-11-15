import React from "react";
import { BRAND_NAME, OG_IMAGE_PATH, SITE_URL } from "@/lib/site";
import { FAQ_ITEMS, PRICING_PACKS, type FaqItem } from "@/lib/beevo-data";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      "Beevo is an AI-powered illustrated cartoon storytelling and explainer video platform converting ideas and scripts into narration-synced animated MP4 videos.",
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: SITE_URL,
    description:
      "Turn your ideas into animated cartoon videos with dynamic storyboards, consistent illustrations, natural voiceover, and one-time credit packs.",
  };
}

export function buildSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    image: `${SITE_URL}${OG_IMAGE_PATH}`,
    description:
      "AI-powered illustrated cartoon storytelling and explainer video SaaS that transforms prompts or scripts into storyboarded cartoon illustrations, timestamp-aligned voiceover, smooth motion graphics, captions, licensed audio, and downloadable MP4 videos.",
    offers: PRICING_PACKS.map((pack) => ({
      "@type": "Offer",
      name: `${BRAND_NAME} ${pack.name} Credit Pack (${pack.creditsLabel})`,
      price: String(pack.priceInr),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
      description: `${pack.creditsLabel} — ${pack.capacityLabel}. One-time purchase, no subscription.`,
    })),
  };
}

export function buildPricingProductSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Beevo One-Time Video Credit Packs",
    brand: {
      "@type": "Brand",
      name: BRAND_NAME,
    },
    image: `${SITE_URL}${OG_IMAGE_PATH}`,
    description:
      "One-time credit packs for creating illustrated cartoon storytelling videos in Beevo. 100 credits equal 1 minute of video (25 credits per 15 seconds), split across multiple projects up to 10 minutes each.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "299",
      highPrice: "899",
      offerCount: String(PRICING_PACKS.length),
      offers: PRICING_PACKS.map((pack) => ({
        "@type": "Offer",
        name: `${pack.name} — ${pack.creditsLabel}`,
        price: String(pack.priceInr),
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/get-started?pack=${pack.id}`,
        description: `${pack.creditsLabel} (${pack.capacityLabel}). One-time purchase.`,
      })),
    },
  };
}

export function buildFaqSchema(items: FaqItem[] = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.href === "/" ? "" : item.href}`,
    })),
  };
}
