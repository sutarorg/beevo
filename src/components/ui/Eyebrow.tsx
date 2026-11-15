import React from "react";

interface EyebrowProps {
  children: React.ReactNode;
  showSparkle?: boolean;
  className?: string;
}

/**
 * Reference-calibrated compact rectangular eyebrow tag.
 * Fine warm gold border, pale warm-white fill, 8-10px corner radius.
 */
export function Eyebrow({ children, showSparkle = false, className = "" }: EyebrowProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[9px] border border-beevo-border-warm bg-[#FFFDF6] px-2.5 py-[5px] text-[12px] font-bold leading-none tracking-[0.005em] text-beevo-honey-text shadow-[0_1px_2px_rgba(229,165,0,0.06)] ${className}`}
    >
      {showSparkle && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-beevo-honey"
        >
          <path
            d="M8 1.2L9.55 6.05L14.4 7.6L9.55 9.15L8 14L6.45 9.15L1.6 7.6L6.45 6.05L8 1.2Z"
            fill="currentColor"
          />
        </svg>
      )}
      {children}
    </span>
  );
}
