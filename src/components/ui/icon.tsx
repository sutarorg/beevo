import {
  BadgePercent,
  Clapperboard,
  Fingerprint,
  GraduationCap,
  IndianRupee,
  Link2,
  MonitorPlay,
  Share2,
  ShieldCheck,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";

/** Resolve icon keys from content modules (@/lib/content) to components. */
const ICONS: Record<string, LucideIcon> = {
  BadgePercent,
  Clapperboard,
  Fingerprint,
  GraduationCap,
  IndianRupee,
  Link2,
  MonitorPlay,
  Share2,
  ShieldCheck,
  Store,
  UserRound,
};

export function ContentIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Store;
  return <Icon className={className} aria-hidden="true" />;
}
