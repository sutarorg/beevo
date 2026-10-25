"use client";

import { GraduationCap, Presentation } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CREATOR_DASHBOARD_PATH,
  LEARNER_DASHBOARD_PATH,
  fetchSession,
  getAccountModePref,
  getCachedSession,
  setAccountModePref,
  subscribeSessionCache,
  type SessionSnapshot,
} from "@/lib/services/auth";

const noSession = (): SessionSnapshot | null => null;
const noPref = (): "learner" | "creator" | null => null;
import { cn } from "@/lib/utils";

export type AccountMode = "learner" | "creator";

/**
 * Learner/Creator switch for a single email that holds BOTH accounts.
 *
 * Rendered only when the session reports `hasBothAccounts` — with a single
 * kind of account it returns null, so single-account users never see a
 * toggle with nothing to switch to. Choosing a side navigates straight to
 * that dashboard and remembers the mode for "Dashboard" buttons elsewhere.
 */
export function AccountModeToggle({
  current,
  className,
  compact = false,
}: {
  /** Fixed when rendered inside a dashboard; omit on neutral pages (site header). */
  current?: AccountMode;
  className?: string;
  compact?: boolean;
}) {
  const cached = useSyncExternalStore(subscribeSessionCache, getCachedSession, noSession);
  const pref = useSyncExternalStore(subscribeSessionCache, getAccountModePref, noPref);
  const [verified, setVerified] = useState<SessionSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then((snapshot) => {
      if (!cancelled) setVerified(snapshot);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const session = verified ?? cached;

  if (!session?.hasBothAccounts) return null;

  const active: AccountMode = current ?? pref ?? "creator";
  const choose = (mode: AccountMode) => {
    setAccountModePref(mode);
  };

  const item = (mode: AccountMode, label: string, href: string, Icon: typeof GraduationCap) => (
    <Link
      href={href}
      onClick={() => choose(mode)}
      aria-current={active === mode ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-bold whitespace-nowrap transition-colors",
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        active === mode ? "bg-ink text-cream" : "text-smoke hover:text-ink",
      )}
    >
      <Icon className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
      {label}
    </Link>
  );

  return (
    <div
      role="navigation"
      aria-label="Switch between learner and creator dashboards"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white p-1",
        className,
      )}
    >
      {item("learner", "Learner", LEARNER_DASHBOARD_PATH, GraduationCap)}
      {item("creator", "Creator", CREATOR_DASHBOARD_PATH, Presentation)}
    </div>
  );
}
