import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://beevo.app").replace(/\/$/, "");
export const BRAND_NAME = "Beevo";
export const OG_IMAGE_PATH = "/images/beevo/og-beevo.png";

interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetaOptions): Metadata {
  const canonicalPath = path === "/" ? "/" : path.replace(/\/$/, "");
  const fullUrl = `${SITE_URL}${canonicalPath === "/" ? "" : canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: path === "/" ? title : `${title} | ${BRAND_NAME}`,
      description,
      url: fullUrl,
      siteName: BRAND_NAME,
      type: "website",
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: "Beevo — AI Cartoon Storytelling Video Generator",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: path === "/" ? title : `${title} | ${BRAND_NAME}`,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
