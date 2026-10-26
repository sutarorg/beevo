import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/primitives";

type Variant = "ink" | "accent" | "lime" | "outline" | "outline-cream";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  ink: "bg-ink text-cream border-ink hover:bg-accent-deep hover:border-accent-deep shadow-hard-xs hover:shadow-hard-sm",
  accent:
    "bg-accent-deep text-cream border-ink shadow-hard-xs hover:bg-accent-deeper hover:shadow-hard-sm",
  lime: "bg-lime text-ink border-ink shadow-hard-xs hover:shadow-hard-sm",
  outline:
    "bg-transparent text-ink border-ink hover:bg-ink hover:text-cream",
  "outline-cream":
    "bg-transparent text-cream border-cream hover:bg-cream hover:text-ink",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

export interface ButtonProps extends Omit<ComponentProps<"button">, "children"> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Render as a link. Real navigation only — never a dead control. */
  href?: string;
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = "ink",
  size = "md",
  href,
  loading = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full border-2 font-semibold tracking-tight whitespace-nowrap select-none",
    "transition-transform duration-150 ease-out will-change-transform",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
    "disabled:pointer-events-none disabled:opacity-60",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}
