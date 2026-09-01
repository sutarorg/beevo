import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isYesterday, differenceInCalendarDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number, opts: { decimals?: number } = {}) {
  const decimals = opts.decimals ?? (Number.isInteger(amount) ? 0 : 2);
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function formatCompact(n: number): string {
  if (n >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1).replace(/\.0$/, "") + " Cr";
  if (n >= 1_00_000) return (n / 1_00_000).toFixed(1).replace(/\.0$/, "") + " L";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, d MMM");
}

export function formatTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, h:mm a");
}

export function relativeFromNow(iso: string): string {
  const days = differenceInCalendarDays(new Date(iso), new Date());
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight honey";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function pluralize(n: number, one: string, many?: string) {
  return n === 1 ? one : many ?? one + "s";
}
