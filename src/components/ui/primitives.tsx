import { Loader2, UserRound } from "lucide-react";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />;
}

/** Small rotated pill used for eyebrows, prices and labels. */
export function Sticker({
  children,
  color = "lime",
  className,
}: {
  children: ReactNode;
  color?: "lime" | "accent" | "cream" | "ink";
  className?: string;
}) {
  const colors = {
    lime: "bg-lime text-ink",
    accent: "bg-accent-deep text-cream",
    cream: "bg-cream text-ink",
    ink: "bg-ink text-cream",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex -rotate-2 items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase shadow-hard-xs",
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = "left",
  dark = false,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p
        className={cn(
          "mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.22em] uppercase",
          align === "center" && "justify-center",
          dark ? "text-lime" : "text-accent-deep",
        )}
      >
        <span aria-hidden="true" className={cn("inline-block size-2 rounded-full", dark ? "bg-lime" : "bg-accent")} />
        {eyebrow}
      </p>
      <h2
        className={cn(
          "text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl",
          dark ? "text-cream" : "text-ink",
        )}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-pretty sm:text-lg",
            dark ? "text-cream/70" : "text-smoke",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-smoke">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-accent-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends ComponentProps<"input"> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-ink transition-colors",
        "placeholder:text-smoke focus:outline-none",
        invalid
          ? "border-accent-deep ring-4 ring-accent/15"
          : "border-ink focus:border-accent focus:ring-4 focus:ring-accent/15",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Avatar for creators and learners.
 *
 * There is no stock "default profile photo" anywhere in the product: when a
 * person hasn't uploaded one yet we show the standard user icon instead of
 * someone else's face.
 */
export function ProfileAvatar({
  src,
  name,
  sizePx = 64,
  className,
  priority = false,
}: {
  src?: string | null;
  name?: string;
  sizePx?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-parchment",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name ? `${name} profile photo` : "Profile photo"}
          fill
          sizes={`${sizePx}px`}
          className="object-cover"
          priority={priority}
        />
      ) : (
        <UserRound
          aria-hidden="true"
          className="text-smoke"
          strokeWidth={2}
          style={{ width: Math.round(sizePx * 0.55), height: Math.round(sizePx * 0.55) }}
        />
      )}
    </span>
  );
}
