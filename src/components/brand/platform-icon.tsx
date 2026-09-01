import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaPinterestP,
  FaYoutube,
} from "react-icons/fa6";
import { platformById } from "@/lib/constants";
import type { PlatformId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<PlatformId, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  twitter: FaXTwitter,
  linkedin: FaLinkedinIn,
  pinterest: FaPinterestP,
  youtube: FaYoutube,
};

export function PlatformIcon({
  platform,
  size = 14,
  className,
  colored = false,
}: {
  platform: PlatformId;
  size?: number;
  className?: string;
  colored?: boolean;
}) {
  const Icon = ICONS[platform];
  return (
    <Icon
      size={size}
      className={className}
      style={colored ? { color: platformById(platform).color } : undefined}
    />
  );
}

/** Chip with soft brand-tinted background — used across calendar, posts, composer. */
export function PlatformChip({
  platform,
  size = 26,
  className,
  active = true,
}: {
  platform: PlatformId;
  size?: number;
  className?: string;
  active?: boolean;
}) {
  const meta = platformById(platform);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[9px] border transition-all",
        active ? "border-transparent" : "border-cream-300 bg-cream-100 text-ink-600/50",
        className
      )}
      style={{
        width: size,
        height: size,
        background: active ? meta.softBg : undefined,
        color: active ? meta.color : undefined,
      }}
      title={meta.name}
    >
      <PlatformIcon platform={platform} size={size * 0.52} />
    </span>
  );
}
