"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BeeWordmark } from "@/components/brand/bee-mark";
import { Button } from "@/components/ui/primitives";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#platforms", label: "Platforms" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
        // Solid (not translucent) background while scrolled — a translucent
        // cream bar over the page's dark sections rendered as a dark line.
        scrolled ? "bg-cream-100 shadow-[0_4px_24px_-12px_rgba(17,11,6,0.22)]" : "bg-transparent shadow-none"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Beevo home">
          <BeeWordmark />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-honey-100/70 hover:text-ink-950",
                pathname === l.href && "text-honey-700"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:text-ink-950 sm:block">
            Log in
          </Link>
          <Link href="/signup">
            <Button size="sm">
              Start free <ArrowRight size={14} />
            </Button>
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="cursor-pointer p-2 text-ink-800 md:hidden" aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-cream-300 bg-cream-100/95 backdrop-blur md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-honey-100"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-honey-100"
              >
                Log in
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
