import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  JsonLd,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "@/components/seo/JsonLd";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildWebsiteSchema()} />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
