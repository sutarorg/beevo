"use client";

import { CheckCircle2, CircleX, Info, MailCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card shell for every auth screen. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-smoke">{subtitle}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

type StateTone = "success" | "mail" | "error" | "info";

const TONES: Record<
  StateTone,
  { Icon: typeof Info; badge: string }
> = {
  success: { Icon: CheckCircle2, badge: "bg-lime" },
  mail: { Icon: MailCheck, badge: "bg-lime" },
  error: { Icon: CircleX, badge: "bg-accent text-cream" },
  info: { Icon: Info, badge: "bg-parchment" },
};

/** Full-card status display: verification pending, success, error, etc. */
export function AuthStatePanel({
  tone,
  title,
  message,
  children,
}: {
  tone: StateTone;
  title: string;
  message?: ReactNode;
  children?: ReactNode;
}) {
  const { Icon, badge } = TONES[tone];
  return (
    <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-white p-6 text-center shadow-hard-sm sm:p-8">
      <div
        className={cn(
          "mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink shadow-hard-xs",
          badge,
        )}
      >
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {message ? (
        <div className="mt-2 text-sm leading-relaxed text-smoke">{message}</div>
      ) : null}
      {children ? <div className="mt-6 space-y-3">{children}</div> : null}
    </div>
  );
}

/** Inline form-level error banner. */
export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-xl border-2 border-accent-deep bg-accent/10 p-3"
    >
      <CircleX className="mt-0.5 size-4 shrink-0 text-accent-deep" aria-hidden="true" />
      <p className="text-sm font-semibold text-accent-deep">{message}</p>
    </div>
  );
}

/** Explainers for exercising the mock adapter's success/error paths. */
export function DemoHintBox({ lines }: { lines: string[] }) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-ink/40 bg-parchment p-4">
      <p className="text-[11px] font-bold tracking-[0.18em] text-smoke uppercase">
        Demo cheatsheet
      </p>
      <ul className="mt-2 space-y-1.5">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2 text-xs leading-relaxed text-smoke">
            <span aria-hidden="true" className="mt-1.5 inline-block size-1 rounded-full bg-accent" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
