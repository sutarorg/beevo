import type { ReactNode } from "react";

/**
 * Public creator storefront shell.
 *
 * Storefronts are the creator's own shop window, not a page of the Beevo
 * marketing site — so they deliberately render WITHOUT the Beevo website
 * header (product nav, "Start free" CTA) and WITHOUT the Beevo website footer
 * (product/legal/account columns). Only the creator's own content and the
 * "Powered by Beevo" strip inside the page are shown, which keeps the buyer's
 * attention on the course.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <main id="main">{children}</main>;
}
