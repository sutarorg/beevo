import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo/JsonLd";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const fullItems = [{ name: "Home", href: "/" }, ...items];

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(fullItems)} />
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-beevo-muted">
          {fullItems.map((item, idx) => {
            const isLast = idx === fullItems.length - 1;
            return (
              <li key={item.href} className="inline-flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-beevo-muted/60" aria-hidden="true" />
                )}
                {isLast ? (
                  <span aria-current="page" className="text-beevo-ink">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="rounded px-1 py-0.5 transition-colors hover:text-beevo-ink"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
