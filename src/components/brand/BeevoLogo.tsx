import React from "react";

interface BeevoIconProps {
  size?: number;
  monochrome?: boolean;
  className?: string;
}

/**
 * Original minimal geometric Beevo bee icon.
 * Engineered on a 32x32 grid for crisp legibility at 16px, 20px, 24px, 32px, and 48px.
 */
export function BeevoIcon({ size = 26, monochrome = false, className = "" }: BeevoIconProps) {
  const bodyFill = monochrome ? "currentColor" : "#FFC928";
  const wingFill = monochrome ? "none" : "#FFFDF7";
  const stroke = monochrome ? "currentColor" : "#171717";
  const stripe = monochrome ? "#FFFFFF" : "#171717";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Minimal twin antennae */}
      <path
        d="M12.2 6.6C11.3 4.8 9.9 4.0 8.4 4.3"
        stroke={stroke}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M19.8 6.6C20.7 4.8 22.1 4.0 23.6 4.3"
        stroke={stroke}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* Symmetrical geometric wings */}
      <ellipse
        cx="8.6"
        cy="12.6"
        rx="5.4"
        ry="3.4"
        transform="rotate(-24 8.6 12.6)"
        fill={wingFill}
        stroke={stroke}
        strokeWidth="2.1"
      />
      <ellipse
        cx="23.4"
        cy="12.6"
        rx="5.4"
        ry="3.4"
        transform="rotate(24 23.4 12.6)"
        fill={wingFill}
        stroke={stroke}
        strokeWidth="2.1"
      />
      {/* Rounded geometric honeybee body */}
      <rect
        x="9.2"
        y="7.4"
        width="13.6"
        height="19.2"
        rx="6.8"
        fill={bodyFill}
        stroke={stroke}
        strokeWidth="2.2"
      />
      {/* Clean high-contrast horizontal stripes */}
      <line x1="10.1" y1="14.6" x2="21.9" y2="14.6" stroke={stripe} strokeWidth="2.6" />
      <line x1="10.1" y1="19.8" x2="21.9" y2="19.8" stroke={stripe} strokeWidth="2.6" />
      {/* Geometric stinger tip */}
      <path d="M14.1 26.6L16 29.4L17.9 26.6H14.1Z" fill={stroke} />
    </svg>
  );
}

interface BeevoLogoProps {
  variant?: "horizontal" | "compact" | "icon" | "monochrome";
  iconSize?: number;
  className?: string;
}

export function BeevoLogo({
  variant = "horizontal",
  iconSize,
  className = "",
}: BeevoLogoProps) {
  if (variant === "icon") {
    return <BeevoIcon size={iconSize ?? 28} className={className} />;
  }

  const isMonochrome = variant === "monochrome";
  const isCompact = variant === "compact";
  const resolvedIconSize = iconSize ?? (isCompact ? 23 : 26);

  return (
    <span
      className={`inline-flex items-center select-none ${
        isCompact ? "gap-1.5" : "gap-2"
      } ${className}`}
    >
      <BeevoIcon size={resolvedIconSize} monochrome={isMonochrome} />
      <span
        className={`font-display font-extrabold leading-none tracking-[-0.045em] ${
          isCompact ? "text-[1.2rem]" : "text-[1.35rem]"
        } ${isMonochrome ? "text-current" : "text-beevo-ink"}`}
      >
        beevo
      </span>
    </span>
  );
}
