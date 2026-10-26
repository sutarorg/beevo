import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import {
  APP_NAME,
  APP_TAGLINE,
  APP_URL,
  GOOGLE_SITE_VERIFICATION,
} from "@/lib/config";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  siteJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

/**
 * Self-hosted brand fonts (Space Grotesk + Instrument Serif).
 * Files live in src/app/fonts so builds and previews never depend on a
 * runtime request to Google Fonts. `display: swap` avoids invisible text
 * while the font files load (a Core Web Vitals / accessibility win).
 */
const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/space-grotesk-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/space-grotesk-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/space-grotesk-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/space-grotesk-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    { path: "./fonts/instrument-serif-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

/**
 * Site-wide metadata.
 *
 * `metadataBase` turns every relative canonical/OG URL into an absolute one on
 * the production origin. Page-level metadata is built with `createPageMetadata`
 * (src/lib/seo.ts), which emits title + description + canonical + Open Graph +
 * Twitter in one object so no page can end up with partial/duplicate tags.
 */
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  category: "Education",
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "sell courses online",
    "creator storefront",
    "online course platform india",
    "sell courses to audience",
    "course selling website",
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  // Prevent mobile browsers from auto-linking rupee amounts/emails as phone
  // or mail links (mobile-usability and layout-shift hygiene).
  formatDetection: { telephone: false, email: false, address: false },
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/images/brand/beevo-mark-180.png",
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    locale: SITE_LOCALE,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE.url,
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
        alt: DEFAULT_OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
};

/** Mobile viewport + browser chrome colour (no user-scalable lock-out). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f0e2",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${instrumentSerif.variable}`}>
      <body className="bg-cream font-display text-ink antialiased">
        {/*
          Scroll-reveal enhancement. Content is visible by default (so crawlers
          and no-JS visitors get the full page); this flag is set before paint
          and lets CSS hide only the elements that JavaScript will reveal again.
          A data attribute avoids hydration mismatches on <html class>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.setAttribute("data-js","");',
          }}
        />
        <JsonLd id="beevo-site-structured-data" data={siteJsonLd()} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:border-2 focus:border-ink focus:bg-lime focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
