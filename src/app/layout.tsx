import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  JsonLd,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "@/components/seo/JsonLd";
import { BRAND_NAME, OG_IMAGE_PATH, SITE_URL } from "@/lib/site";

const sora = localFont({
  src: [
    { path: "./fonts/sora-latin-wght-normal.woff2", weight: "100 800", style: "normal" },
    { path: "./fonts/sora-latin-ext-wght-normal.woff2", weight: "100 800", style: "normal" },
  ],
  variable: "--font-sora",
  display: "swap",
});

const manrope = localFont({
  src: [
    { path: "./fonts/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/manrope-latin-ext-wght-normal.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFEFB",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Beevo — Turn Your Ideas Into Animated Cartoon Videos",
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "Turn your idea or script into a complete illustrated cartoon video with dynamic storyboards, consistent characters, natural AI voiceover, smooth motion, captions, and licensed music. Simple one-time credit packs, no subscription.",
  applicationName: BRAND_NAME,
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: BRAND_NAME,
    url: SITE_URL,
    title: "Beevo — Turn Your Ideas Into Animated Cartoon Videos",
    description:
      "AI-powered illustrated cartoon storytelling and explainer videos from your idea or script. Dynamic storyboards, natural voiceover, smooth motion, and one-time credit packs.",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Beevo — AI Cartoon Video Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beevo — Turn Your Ideas Into Animated Cartoon Videos",
    description:
      "AI-powered illustrated cartoon storytelling and explainer videos from your idea or script. One-time credit packs, no subscription.",
    images: [OG_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col bg-beevo-canvas text-beevo-body antialiased selection:bg-beevo-yellow/40 selection:text-beevo-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-beevo-yellow focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-beevo-ink focus:shadow-lg"
        >
          Skip to main content
        </a>
        <JsonLd data={buildOrganizationSchema()} />
        <JsonLd data={buildWebsiteSchema()} />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
