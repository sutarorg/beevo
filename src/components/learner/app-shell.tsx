"use client";

import { FlaskConical, GraduationCap, LifeBuoy, LogIn, LogOut, ReceiptText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DEMO_LEARNER_NOTE, DEMO_LEARNER } from "@/lib/mocks/learner";
import { isMockAuth } from "@/lib/services/auth";
import { getLearnerService, resetLearnerMockData } from "@/lib/services/learner";
import { cn } from "@/lib/utils";
import { RequireSession } from "@/components/auth/gates";
import { LogoMark } from "@/components/site/chrome";
import { FailedState } from "@/components/creator/ui";
import { UnavailablePanel } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

const LEARNER_NAV = [
  { href: "/learn/courses", label: "My learning", icon: GraduationCap },
  { href: "/learn/purchases", label: "Purchases", icon: ReceiptText },
  { href: "/learn/settings", label: "Settings", icon: Settings },
  { href: "/learn/support", label: "Support", icon: LifeBuoy },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sign-in gate: without a (demo) learner session, show the handoff panel. */
export function LearnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const service = getLearnerService();
  const toast = useToast();
  const [nonce, setNonce] = useState(0);
  const [email, setEmail] = useState(DEMO_LEARNER.email);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (!service) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-cream px-4">
        <UnavailablePanel
          title="The learner area isn’t available"
          message="We couldn't reach the learning services. Check your connection and reload."
        />
      </main>
    );
  }

  const demo = isMockAuth();
  const session = demo ? service.getSession() : { signedIn: true, profile: null };

  const signIn = async () => {
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Enter a valid email to continue.");
      return;
    }
    setSigningIn(true);
    setError(null);
    const result = await service.signIn(clean);
    setSigningIn(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast.push({
      variant: "success",
      title: `Welcome, ${result.data.name.split(" ")[0]} (demo sign-in)`,
      description: "Your demo library is ready.",
    });
    setNonce((n) => n + 1);
    router.refresh();
  };

  if (!session.signedIn) {
    return (
      <main
        id="main"
        className="grid min-h-dvh place-items-center bg-parchment px-4 py-14"
        key={nonce}
      >
        <div className="w-full max-w-md">
          <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-8">
            <span className="grid size-14 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-hard-xs">
              <LogIn className="size-7" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">
              Sign in to your learning
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              Your purchased courses, progress, and receipts live here. Sign in with the email you
              used at checkout.
            </p>
            <div className="mt-5">
              <Field id="learn-email" label="Email" error={error ?? undefined}>
                <Input
                  id="learn-email"
                  type="email"
                  value={email}
                  invalid={Boolean(error)}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  autoComplete="email"
                />
              </Field>
            </div>
            <Button variant="accent" size="lg" className="mt-4 w-full" onClick={signIn} loading={signingIn}>
              Continue
            </Button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-smoke">
              Demo sign-in — prefilled with the sample learner. Any valid email works; the library
              stays the demo one.
            </p>
            <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-4 text-center">
              <Link href="/" className="text-xs font-semibold text-smoke underline underline-offset-4 hover:text-accent">
                ← Back to Beevo
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <RequireSession>
    <div className="min-h-dvh bg-cream lg:pl-60" key={nonce}>
      {/* Demo strip (mock mode only) */}
      {demo ? (
      <div className="fixed inset-x-0 top-0 z-40 border-b-2 border-ink bg-lime lg:left-60">
        <div className="flex h-9 items-center gap-2 px-3 sm:px-4">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold tracking-wide text-ink uppercase">
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Demo learner
          </span>
          <span className="hidden min-w-0 flex-1 truncate text-[11px] font-medium text-ink/70 sm:block">
            {DEMO_LEARNER_NOTE}
          </span>
          <button
            type="button"
            onClick={() => resetLearnerMockData()}
            className="ml-auto shrink-0 rounded-full border-2 border-ink bg-cream px-2.5 py-1 text-[11px] font-bold text-ink transition-colors hover:bg-white"
          >
            Reset demo data
          </button>
        </div>
      </div>
      ) : null}

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-2 border-ink bg-cream lg:flex">
        <div className="flex h-16 items-center border-b-2 border-ink px-5">
          <Link href="/learn/courses" className="text-lg font-bold tracking-tight text-ink">
            <LogoMark className="mr-2 inline-grid size-8 align-middle" />
            Beevo{" "}
            <span className="font-editorial text-sm font-normal text-smoke italic">learn</span>
          </Link>
        </div>
        <nav aria-label="Learner" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {LEARNER_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-ink bg-ink text-cream shadow-hard-xs"
                    : "border-transparent text-smoke hover:border-ink hover:bg-white hover:text-ink",
                )}
              >
                <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t-2 border-ink p-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime text-xs font-bold">
              {session.profile?.name.split(" ").map((part) => part[0]).join("") ?? (demo ? "?" : "M")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink">{session.profile?.name ?? "My account"}</p>
              <p className="truncate text-[10px] text-smoke">{session.profile?.email ?? "Signed in"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              service.signOut();
              if (demo) {
                setNonce((n) => n + 1);
              } else {
                window.location.assign("/login");
              }
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-white px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-parchment"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            {demo ? "Sign out (demo)" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className={cn("fixed inset-x-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-sm lg:hidden", demo ? "top-9" : "top-0")}>
        <div className="flex h-13 items-center justify-between px-4">
          <Link href="/learn/courses" className="text-lg font-bold tracking-tight text-ink">
            <LogoMark className="mr-2 inline-grid size-7 align-middle" />
            Beevo{" "}
            <span className="font-editorial text-xs font-normal text-smoke italic">learn</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              service.signOut();
              if (demo) setNonce((n) => n + 1);
              else window.location.assign("/login");
            }}
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={cn("px-4 pb-26 sm:px-6 lg:px-8 lg:pb-12", demo ? "pt-30 lg:pt-28" : "pt-16 lg:pt-20")}>
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Learner" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream lg:hidden">
        <div className="grid grid-cols-4">
          {LEARNER_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold",
                  active ? "text-accent" : "text-smoke",
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </RequireSession>
  );
}

export { FailedState as LearnerFailedState };
