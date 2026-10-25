import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Square Beevo brand tile, shared by the header, footer and app shells.
 * Kept in its own dependency-free module so lightweight shells never pull
 * the full site chrome (menus, session fetching) into their bundles.
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
        width={256}
        height={256}
        sizes="36px"
        className="block size-full object-contain"
        priority
      />
    </span>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" aria-label="Beevo home" className="group inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={cn("text-xl font-bold tracking-tight", dark ? "text-cream" : "text-ink")}>
        Beevo
      </span>
    </Link>
  );
}
