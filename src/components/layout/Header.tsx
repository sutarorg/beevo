"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BeevoLogo } from "@/components/brand/BeevoLogo";
import { PRIMARY_NAV } from "@/lib/beevo-data";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close drawer on Escape key & prevent background scroll when open
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-beevo-border/60 bg-[#FFFEFB]/95 backdrop-blur-md">
      <div className="beevo-container flex h-[64px] items-center justify-between gap-4 md:h-[70px]">
        {/* Brand lockup — minimal geometric icon + lowercase beevo */}
        <Link
          href="/"
          aria-label="Beevo — Home"
          className="inline-flex min-h-[44px] items-center rounded-lg pr-1"
        >
          <span className="hidden sm:inline-flex">
            <BeevoLogo variant="horizontal" iconSize={25} />
          </span>
          <span className="inline-flex sm:hidden">
            <BeevoLogo variant="compact" iconSize={23} />
          </span>
        </Link>

        {/* Centered Desktop Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 lg:flex xl:gap-9"
        >
          {PRIMARY_NAV.map((item) => {
            const isActive =
              item.href !== "/#examples" &&
              (pathname === item.href || pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-1 py-2 text-[13.5px] font-semibold transition-colors ${
                  isActive
                    ? "text-beevo-honey-text"
                    : "text-beevo-ink/90 hover:text-beevo-honey-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions — Desktop */}
        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-[40px] items-center rounded-md px-2 text-[13.5px] font-semibold text-beevo-ink transition-colors hover:text-beevo-honey-text"
          >
            Log in
          </Link>
          <Link
            href="/get-started"
            className="beevo-btn-primary h-[38px] rounded-[12px] px-[20px] text-[13px]"
          >
            Get Started
          </Link>
        </div>

        {/* Tablet & Mobile Compact Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/get-started"
            className="beevo-btn-primary min-h-[44px] rounded-full px-4 text-[13px]"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-beevo-border bg-white text-beevo-ink transition-colors hover:bg-beevo-cream"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Accessible Drawer */}
      {menuOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-x-0 top-[64px] bottom-0 z-50 overflow-y-auto border-t border-beevo-border bg-[#FFFEFB] px-5 pb-10 pt-5 md:top-[70px] lg:hidden"
        >
          <nav aria-label="Mobile links" className="mx-auto max-w-md space-y-1">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[48px] items-center justify-between rounded-xl px-3.5 text-[16px] font-bold text-beevo-ink transition-colors hover:bg-beevo-cream"
              >
                {item.label}
              </Link>
            ))}

            <div className="my-4 border-t border-beevo-border pt-4">
              <p className="mb-2 px-3.5 text-[12px] font-bold uppercase tracking-wider text-beevo-muted">
                Use Cases
              </p>
              <Link
                href="/use-cases/education"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3.5 text-[14.5px] font-semibold text-beevo-body hover:bg-beevo-cream"
              >
                Education &amp; Kids Learning
              </Link>
              <Link
                href="/use-cases/content-creators"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3.5 text-[14.5px] font-semibold text-beevo-body hover:bg-beevo-cream"
              >
                Content Creators &amp; YouTube
              </Link>
              <Link
                href="/use-cases/business-explainers"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3.5 text-[14.5px] font-semibold text-beevo-body hover:bg-beevo-cream"
              >
                Business &amp; Training Explainers
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-beevo-border pt-5">
              <Link
                href="/get-started"
                onClick={() => setMenuOpen(false)}
                className="beevo-btn-primary min-h-[48px] w-full text-[15px]"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="beevo-btn-secondary min-h-[48px] w-full text-[15px]"
              >
                Log in
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
