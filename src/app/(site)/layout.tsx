import type { ReactNode } from "react";
import { Footer, Header } from "@/components/site/chrome";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
