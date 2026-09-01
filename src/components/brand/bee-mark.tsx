import { cn } from "@/lib/utils";

/**
 * Beevo brand mark — a geometric bee resting on a honeycomb cell.
 */
export function BeeMark({
  size = 36,
  withHex = true,
  className,
  id = "bee",
}: {
  size?: number;
  withHex?: boolean;
  className?: string;
  id?: string;
}) {
  const gid = `g-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-label="Beevo bee"
      role="img"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F9CB50" />
          <stop offset="1" stopColor="#F5A301" />
        </linearGradient>
      </defs>
      {withHex && <path d="M32 2 60 18v28L32 62 4 46V18Z" fill={`url(#${gid})`} />}
      <ellipse cx="24" cy={withHex ? 22 : 20} rx="10" ry="6.5" fill="#FFFDF7" opacity="0.9" transform={`rotate(-28 24 ${withHex ? 22 : 20})`} />
      <ellipse cx="40" cy={withHex ? 22 : 20} rx="10" ry="6.5" fill="#FFFDF7" opacity="0.9" transform={`rotate(28 40 ${withHex ? 22 : 20})`} />
      <ellipse cx="32" cy={withHex ? 37 : 34} rx="12" ry="15" fill="#171008" />
      <rect x="21.5" y={withHex ? 31 : 28} width="21" height="4" rx="2" fill="#F5A301" />
      <rect x="21" y={withHex ? 40 : 37} width="22" height="4" rx="2" fill="#F5A301" />
    </svg>
  );
}

export function BeeWordmark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <BeeMark size={34} />
      <span
        className={cn(
          "text-[22px] font-semibold tracking-tight leading-none",
          dark ? "text-cream-50" : "text-ink-900"
        )}
      >
        beevo
        <span className="text-honey-500">.</span>
      </span>
    </span>
  );
}

/** A single decorative hexagon cell. */
export function HexCell({
  size = 64,
  className,
  stroke = "#713112",
  opacity = 0.14,
  fill = "none",
}: {
  size?: number;
  className?: string;
  stroke?: string;
  opacity?: number;
  fill?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M32 3 58 18v28L32 61 6 46V18Z"
        fill={fill}
        stroke={stroke}
        strokeOpacity={opacity}
        strokeWidth="2"
      />
    </svg>
  );
}
