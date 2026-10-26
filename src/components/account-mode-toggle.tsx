"use client";

import { Check, ChevronDown, GraduationCap, Presentation } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

const MODES: {
  mode: AccountMode;
  label: string;
  sub: string;
  href: string;
  Icon: typeof GraduationCap;
}[] = [
  {
    mode: "learner",
    label: "Learner",
    sub: "My learning",
    href: LEARNER_DASHBOARD_PATH,
    Icon: GraduationCap,
  },
  {
    mode: "creator",
    label: "Creator",
    sub: "Creator studio",
    href: CREATOR_DASHBOARD_PATH,
    Icon: Presentation,
  },
];

/**
 * Learner/Creator switch for a single email that holds BOTH accounts.
 *
 * Rendered only when the session reports `hasBothAccounts` — with a single
 * kind of account it returns null, so single-account users never see a
 * switch with nothing to switch to. It lives in the dashboard headers,
 * immediately to the left of the notification bell, as a dropdown in the
 * same button language as the bell (h-10, rounded-xl, border-2, hard
 * shadow): the trigger shows the dashboard you are in, the menu lists
 * Learner and Creator. Choosing a side navigates straight to that
 * dashboard and remembers the mode for "Dashboard" buttons elsewhere.
 */
export function AccountModeToggle({
  current,
  className,
  compact = false,
}: {
  /** Fixed when rendered inside a dashboard; omit on neutral pages. */
  current?: AccountMode;
  className?: string;
  compact?: boolean;
}) {
  const cached = useSyncExternalStore(subscribeSessionCache, getCachedSession, noSession);
  const pref = useSyncExternalStore(subscribeSessionCache, getAccountModePref, noPref);
  const [verified, setVerified] = useState<SessionSnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then((snapshot) => {
      if (!cancelled) setVerified(snapshot);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click or Escape, like every other menu on the site.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const session = verified ?? cached;

  if (!session?.hasBothAccounts) return null;

  const active: AccountMode = current ?? pref ?? "learner";
  const activeMode = MODES.find((entry) => entry.mode === active) ?? MODES[0];
  const ActiveIcon = activeMode.Icon;
  const choose = (mode: AccountMode) => {
    setAccountModePref(mode);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch dashboard — currently ${activeMode.label}`}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-white text-sm font-bold whitespace-nowrap text-ink shadow-hard-xs transition-transform active:translate-y-0.5 active:shadow-none",
          compact ? "px-2.5" : "px-3",
        )}
      >
        <ActiveIcon className={compact ? "size-4" : "size-4.5"} aria-hidden="true" />
        {compact ? null : activeMode.label}
        <ChevronDown
          className={cn("size-4 shrink-0 text-smoke transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Switch dashboard"
          className="anim-rise-in absolute top-[calc(100%+8px)] right-0 z-50 w-52 rounded-2xl border-2 border-ink bg-white p-1.5 shadow-hard-sm"
        >
          <p className="px-2.5 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.22em] text-smoke uppercase">
            Switch dashboard
          </p>
          <ul className="space-y-1">
            {MODES.map(({ mode, label, sub, href, Icon }) => {
              const isCurrent = active === mode;
              return (
                <li key={mode}>
                  <Link
                    href={href}
                    role="menuitem"
                    onClick={() => choose(mode)}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-sm font-semibold transition-colors",
                      isCurrent
                        ? "border-ink bg-ink text-cream shadow-hard-xs"
                        : "border-transparent text-smoke hover:border-ink hover:bg-cream hover:text-ink",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block leading-tight">{label}</span>
                      <span
                        className={cn(
                          "block text-[11px] leading-tight font-semibold",
                          isCurrent ? "text-cream/60" : "text-smoke/80",
                        )}
                      >
                        {sub}
                      </span>
                    </span>
                    {isCurrent ? (
                      <Check className="size-4 shrink-0" aria-hidden="true" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
