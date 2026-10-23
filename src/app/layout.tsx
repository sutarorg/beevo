import type { Metadata } from "next";
import { Instrument_Serif, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { APP_NAME, APP_TAGLINE, APP_URL } from "@/lib/config";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "CourseKit gives creators a personal storefront to sell courses directly to their own audience. Free plan, ₹0/month, 8% commission only on successful eligible sales. No marketplace.",
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
