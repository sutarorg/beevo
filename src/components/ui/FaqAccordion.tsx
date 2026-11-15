"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/beevo-data";

interface FaqAccordionProps {
  items: FaqItem[];
  showCategoryFilter?: boolean;
  defaultOpenId?: string;
}

export function FaqAccordion({
  items,
  showCategoryFilter = false,
  defaultOpenId,
}: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? items[0]?.id ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  const visibleItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <div>
      {showCategoryFilter && (
        <div
          role="tablist"
          aria-label="Filter FAQ by topic"
          className="mb-6 flex flex-wrap gap-2"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedCategory(cat);
                  const first =
                    cat === "All" ? items[0] : items.find((i) => i.category === cat);
                  setOpenId(first?.id ?? null);
                }}
                className={`min-h-[44px] rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                  active
                    ? "bg-beevo-yellow text-beevo-ink shadow-beevo-cta"
                    : "border border-beevo-border bg-white text-beevo-body hover:border-beevo-border-warm hover:bg-beevo-cream/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      <div className="divide-y divide-beevo-border rounded-[18px] border border-beevo-border bg-white shadow-beevo-card">
        {visibleItems.map((item) => {
          const isOpen = openId === item.id;
          const panelId = `faq-panel-${item.id}`;
          const buttonId = `faq-btn-${item.id}`;

          return (
            <div key={item.id} className="group">
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-beevo-cream/40 sm:px-6 sm:py-5"
                >
                  <span className="font-display text-[15px] font-bold leading-snug text-beevo-ink sm:text-[16px]">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isOpen
                        ? "rotate-180 border-beevo-yellow bg-beevo-yellow text-beevo-ink"
                        : "border-beevo-border bg-beevo-canvas text-beevo-muted group-hover:border-beevo-border-warm"
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="px-5 pb-5 pt-0.5 text-[14.5px] leading-[1.68] text-beevo-body sm:px-6 sm:pb-6 sm:text-[15px]"
              >
                <p className="max-w-[72ch]">{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
