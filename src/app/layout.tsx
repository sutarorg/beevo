import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { APP_NAME, APP_TAGLINE, APP_URL } from "@/lib/config";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

/**
 * Self-hosted brand fonts (Space Grotesk + Instrument Serif).
 * Files live in src/app/fonts so builds and previews never depend on a
 * runtime request to Google Fonts.
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

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  icons: {
    icon: "/images/brand/beevo-mark.png",
    shortcut: "/images/brand/beevo-mark.png",
    apple: "/images/brand/beevo-mark.png",
  },
  openGraph: {
    siteName: APP_NAME,
    images: ["/images/brand/beevo-og.png"],
  },
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Beevo gives creators a personal storefront to sell courses directly to their own audience. Free plan, ₹0/month, 8% commission only on successful eligible sales. No marketplace.",
  keywords: [
    "sell courses online",
    "creator storefront",
    "online course platform india",
    "sell courses to audience",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${instrumentSerif.variable}`}>
      <body className="bg-cream font-display text-ink antialiased">
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
