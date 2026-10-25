"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_TAGLINE, SUPPORT_EMAIL } from "@/lib/config";
import { PLATFORM_COMMISSION_LABEL } from "@/lib/domain";
import { NAV_LINKS } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

/**
 * Square Beevo brand tile, shared by the header, footer and app shells.
 * Keep the image square at every size so its rounded corners stay proportional.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[22%] transition-transform duration-200 group-hover:-rotate-6",
        className,
      )}
    >
      <Image
        src="/images/brand/beevo-mark.png"
        alt=""
        width={500}
        height={500}
        sizes="36px"
        className="block size-full object-contain"
        priority
      />
    </span>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Beevo home"
      className="group inline-flex items-center gap-2.5"
    >
      <LogoMark />
      <span
        className={cn(
          "text-xl font-bold tracking-tight",
          dark ? "text-cream" : "text-ink",
        )}
      >
        Beevo
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "link-underline text-sm font-semibold transition-colors",
                  pathname === link.href ? "text-accent" : "text-ink hover:text-accent",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="link-underline hidden text-sm font-semibold text-ink hover:text-accent sm:block"
            >
              Log in
            </Link>
            <Button href="/signup" size="sm" className="hidden sm:inline-flex">
              Start free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-cream shadow-hard-xs transition-transform active:translate-y-0.5 active:shadow-none md:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex flex-col bg-ink text-cream md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-16 items-center justify-between border-b-2 border-cream/20 px-4">
              <Logo dark />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-xl border-2 border-cream/40"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <nav
              aria-label="Mobile"
              className="flex flex-1 flex-col justify-center gap-1 px-6"
            >
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.06, duration: 0.35 }}
                >
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between border-b border-cream/15 py-4"
                  >
                    <span className="font-editorial text-4xl italic">
                      {link.label}
                    </span>
                    <ArrowRight
                      className="size-6 text-lime transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.35 }}
              className="space-y-4 px-6 pb-8"
            >
              <Button href="/signup" variant="lime" size="lg" className="w-full">
                Start free — ₹0/month
              </Button>
              <p className="text-center text-sm text-cream/60">
                Already creating?{" "}
                <Link href="/login" className="font-semibold text-lime underline underline-offset-4">
                  Log in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Create account" },
      { href: "/login", label: "Log in" },
      { href: `mailto:${SUPPORT_EMAIL}`, label: "Contact support" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              {APP_TAGLINE}
            </p>
            <div className="mt-5">
              <Sticker color="lime" className="border-lime shadow-none">
                Not a marketplace
              </Sticker>
            </div>
            <div className="mt-5 rounded-2xl border-2 border-cream/20 bg-cream/5 p-4 text-xs leading-relaxed text-cream/70">
              <p>
                Free plan · ₹0/month · {PLATFORM_COMMISSION_LABEL} commission per
                successful eligible course sale. No Pro plan.
              </p>
            </div>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-xs font-bold tracking-[0.22em] text-lime uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-underline text-sm text-cream/80 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-cream/15 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Beevo. Made for creators, not algorithms.</p>
          <p>Course purchases are non-refundable except where required by law.</p>
        </div>
      </div>
    </footer>
  );
}
