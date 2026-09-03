import type { Metadata } from "next";
import { Space_Grotesk, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Beevo — Social Media Planner",
    template: "%s · Beevo",
  },
  description:
    "Plan, schedule and publish to Instagram, Facebook, X, LinkedIn, Pinterest and YouTube from one honey-organised hive. Free forever plan — Pro at ₹499/month, GST included.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster
          position="top-center"
          gap={8}
          toastOptions={{
            className:
              "!bg-ink-900 !text-cream-50 !border !border-ink-700 !shadow-lift !rounded-xl !font-sans",
            classNames: { success: "!border-honey-500/50", error: "!border-berry-600/60" },
          }}
        />
      </body>
    </html>
  );
}
