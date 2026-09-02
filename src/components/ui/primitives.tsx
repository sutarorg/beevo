"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock, useOnClickOutside } from "@/lib/hooks";

/* ------------------------------ Button ------------------------------ */
type BtnVariant = "primary" | "dark" | "outline" | "ghost" | "danger" | "white";
type BtnSize = "sm" | "md" | "lg" | "xs";

const btnVariants: Record<BtnVariant, string> = {
  primary:
    "bg-gradient-to-b from-honey-300 to-honey-500 text-ink-950 font-semibold shadow-[var(--shadow-gold)] hover:brightness-[1.05] active:brightness-95 border border-honey-600/30",
  dark: "bg-ink-900 text-cream-50 font-semibold hover:bg-ink-800 border border-ink-700",
  outline:
    "bg-white/70 text-ink-900 font-medium border border-cream-300 hover:border-honey-500/60 hover:bg-honey-50",
  ghost: "text-ink-700 hover:bg-honey-100/70 font-medium",
  danger: "bg-berry-600 text-white font-semibold hover:bg-red-700",
  white: "bg-white text-ink-900 font-semibold border border-cream-300 hover:border-honey-500/60 shadow-[var(--shadow-card)]",
};

const btnSizes: Record<BtnSize, string> = {
  xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
  sm: "h-8.5 px-3.5 text-[13px] rounded-xl gap-2",
  md: "h-10 px-4.5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-2xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  busy = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
  busy?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 cursor-pointer",
        "disabled:opacity-55 disabled:pointer-events-none active:scale-[0.98]",
        btnVariants[variant],
        btnSizes[size],
        className
      )}
      disabled={disabled || busy}
      {...props}
    >
      {busy && <Loader2 className="animate-spin" size={15} />}
      {children}
    </button>
  );
}

/* ------------------------------ Badge ------------------------------ */
const badgeTones = {
  gold: "bg-honey-100 text-honey-800 border-honey-300/70",
  green: "bg-lime-50 text-leaf-600 border-lime-200",
  red: "bg-red-50 text-berry-600 border-red-200",
  ink: "bg-ink-900 text-cream-50 border-ink-700",
  neutral: "bg-cream-100 text-ink-700 border-cream-300",
  outline: "bg-transparent text-ink-600 border-cream-300",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof badgeTones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-honey-400 to-honey-600 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-ink-950",
        className
      )}
    >
      Pro
    </span>
  );
}

/* ------------------------------ Card ------------------------------ */
export function Card({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-cream-300/80 bg-white/85 shadow-[var(--shadow-card)] backdrop-blur-sm",
        hover && "transition-all duration-200 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 hover:border-honey-400/50",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-4.5 pb-3", className)}>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-600/80">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Form ------------------------------ */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600/90", className)}>
      {children}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-cream-300 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-600/40",
          "transition-colors hover:border-honey-400/60 focus:border-honey-500 focus:outline-none focus:ring-4 focus:ring-honey-500/15",
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-cream-300 bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-900 placeholder:text-ink-600/40",
          "transition-colors hover:border-honey-400/60 focus:border-honey-500 focus:outline-none focus:ring-4 focus:ring-honey-500/15",
          className
        )}
        {...props}
      />
    );
  }
);

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full cursor-pointer appearance-none rounded-xl border border-cream-300 bg-white px-3.5 text-sm text-ink-900",
        "transition-colors hover:border-honey-400/60 focus:border-honey-500 focus:outline-none focus:ring-4 focus:ring-honey-500/15",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
        checked ? "bg-gradient-to-r from-honey-400 to-honey-600" : "bg-cream-300",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

/* ------------------------------ Segmented ------------------------------ */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  id,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  id: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl border border-cream-300 bg-cream-100 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
            value === o.value ? "text-ink-950" : "text-ink-600/70 hover:text-ink-900"
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-lg bg-white shadow-[var(--shadow-card)] border border-cream-300/70"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative z-10 inline-flex items-center gap-1.5">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Modal ------------------------------ */
export function Modal({
  open,
  onClose,
  children,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  useBodyScrollLock(open);
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[6px]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={cn(
              "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-cream-300 bg-cream-50 shadow-[var(--shadow-lift)] sm:rounded-3xl",
              sizes[size],
              className
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Popover ------------------------------ */
export function Popover({
  trigger,
  children,
  align = "right",
  className,
  width,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  className?: string;
  width?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)} className="inline-flex">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 mt-2 overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-[var(--shadow-lift)]",
              align === "right" ? "right-0" : "left-0",
              width ?? "w-64",
              className
            )}
          >
            {typeof children === "function" ? children(() => setOpen(false)) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ Meter ------------------------------ */
export function Meter({
  value,
  max,
  className,
  warnAt = 0.75,
}: {
  value: number;
  max: number;
  className?: string;
  warnAt?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const warn = value / max >= warnAt;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-cream-200", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
        className={cn(
          "h-full rounded-full",
          warn ? "bg-gradient-to-r from-honey-500 to-berry-600" : "bg-gradient-to-r from-honey-400 to-honey-600"
        )}
      />
    </div>
  );
}

/* ------------------------------ Skeleton / Empty ------------------------------ */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-honey-500/40 bg-honey-50/50 px-6 py-12 text-center comb-light", className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-honey-100 text-honey-700 border border-honey-300/60">
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-600/80">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------ Hex Avatar ------------------------------ */
export function HexAvatar({
  name,
  hue = 40,
  size = 36,
  className,
  src,
}: {
  name: string;
  hue?: number;
  size?: number;
  className?: string;
  /** When present, renders the uploaded avatar image instead of initials. */
  src?: string | null;
}) {
  const ini = name
    .replace(/^@/, "")
    .split(/[\s.]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <span
        className={cn("hex-clip inline-block overflow-hidden bg-cream-200 align-middle", className)}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn("hex-clip inline-flex items-center justify-center font-semibold text-white select-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 72% 52%), hsl(${hue + 28} 68% 40%))`,
      }}
    >
      {ini}
    </span>
  );
}

/* ------------------------------ Stat delta ------------------------------ */
export function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        up ? "bg-lime-50 text-leaf-600" : "bg-red-50 text-berry-600",
        className
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}
