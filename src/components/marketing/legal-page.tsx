import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Hexagon, Mail, MapPin } from "lucide-react";
import { LegalToc } from "./legal-toc";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared legal facts                                                  */
/* ------------------------------------------------------------------ */
export const LEGAL_CONTACT = {
  company: "Beevo Labs Pvt. Ltd.",
  support: "support@beevo.in",
  privacy: "privacy@beevo.in",
  address: "Beevo Labs Pvt. Ltd., Bengaluru, Karnataka, India",
  gstin: "29BEEVO2026K1Z5",
};

export interface LegalMeta {
  title: string;
  /** Part of the title rendered in italic serif honey — e.g. "Policy". */
  accent: string;
  path: string;
  blurb: string;
  icon: React.ElementType;
}

const ALL_PAGES: LegalMeta[] = [
  { title: "Privacy Policy", accent: "Policy", path: "/privacy", blurb: "What we collect, why, and the control you have over it.", icon: Hexagon },
  { title: "Terms of Service", accent: "Service", path: "/terms", blurb: "The agreement between you and Beevo when you use the hive.", icon: Hexagon },
  { title: "Refund & Cancellation Policy", accent: "Policy", path: "/refund-policy", blurb: "Cancellations, renewals, refunds and failed payments.", icon: Hexagon },
  { title: "Cookie Policy", accent: "Policy", path: "/cookies", blurb: "The cookies we set, what they do, and how to manage them.", icon: Hexagon },
];

/* ------------------------------------------------------------------ */
/* Prose primitives (Beevo-styled)                                     */
/* ------------------------------------------------------------------ */

export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[15px] leading-relaxed text-ink-700/90", className)}>{children}</p>;
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-[15px] font-semibold tracking-tight text-ink-950">{children}</h3>;
}

export function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-2.5 text-[14.5px] leading-relaxed text-ink-700/90 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.62em] [&>li]:before:block [&>li]:before:h-2 [&>li]:before:w-2 [&>li]:before:bg-honey-500 [&>li]:before:[clip-path:polygon(50%_0%,95%_25%,95%_75%,50%_100%,5%_75%,5%_25%)] [&>li]:before:content-['']">
      {children}
    </ul>
  );
}

export function Callout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-honey-500/40 bg-gradient-to-r from-honey-50 to-cream-50 p-4.5 comb-light sm:p-5">
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-honey-800">{title}</p>
      <div className="mt-1.5 text-[14px] leading-relaxed text-ink-800">{children}</div>
    </div>
  );
}

export function LegalTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white/90 shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[560px] text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-cream-300 bg-cream-100/80">
            {columns.map((c) => (
              <th
                key={c}
                className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600/70"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-cream-200/70 last:border-0 align-top">
              {row.map((cell, j) => (
                <td key={j} className={cn("px-4 py-3 leading-relaxed", j === 0 ? "font-semibold text-ink-900" : "text-ink-700/85")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="font-medium text-honey-700 underline decoration-honey-400/60 underline-offset-2 hover:text-honey-800">
    {children}
  </a>
);

export const PageLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="font-medium text-honey-700 underline decoration-honey-400/60 underline-offset-2 hover:text-honey-800">
    {children}
  </Link>
);

/* ------------------------------------------------------------------ */
/* Page shell                                                          */
/* ------------------------------------------------------------------ */
export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function LegalPage({
  meta,
  updated,
  summary,
  sections,
}: {
  meta: { title: string; accent: string; path: string };
  updated: string;
  summary: string;
  sections: LegalSection[];
}) {
  const others = ALL_PAGES.filter((p) => p.path !== meta.path);
  const [head, ...tail] = meta.title.split(meta.accent);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-10 sm:pt-36 comb-light">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(520px 260px at 20% 0%, rgba(245,163,1,0.13), transparent 62%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-700">Legal · Beevo</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
            {head}
            <span className="font-display italic font-medium text-honey-600">{meta.accent}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-600/85">{summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-white/80 px-3 py-1.5 font-mono text-[11px] text-ink-600/75">
              Last updated · {updated}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-white/80 px-3 py-1.5 font-mono text-[11px] text-ink-600/75">
              {LEGAL_CONTACT.company}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <LegalToc items={sections.map((s) => ({ id: s.id, title: s.title }))} />

        <article className="max-w-3xl">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 border-t border-cream-300/70 py-8 first:border-t-0 first:pt-2"
            >
              <h2 className="flex items-start gap-3 text-[19px] font-semibold tracking-tight text-ink-950">
                <span
                  aria-hidden
                  className="hex-clip mt-0.5 flex h-7 w-[26px] shrink-0 items-center justify-center bg-gradient-to-b from-honey-300 to-honey-500 pt-px font-mono text-[11px] font-bold text-ink-950 shadow-[var(--shadow-gold)]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </h2>
              <div className="mt-4 space-y-4">{s.content}</div>
            </section>
          ))}

          {/* Contact card */}
          <div className="mt-10 rounded-3xl border border-honey-500/40 bg-gradient-to-br from-honey-50 to-cream-50 p-6 comb-light sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-ink-950">Questions about this document?</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600/85">
              We&apos;re happy to clarify anything — our small but busy hive answers every email.
            </p>
            <div className="mt-4 grid gap-2.5 text-[13.5px] text-ink-800 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-honey-700" />
                <a href={`mailto:${LEGAL_CONTACT.support}`} className="font-semibold text-honey-800 hover:underline">
                  {LEGAL_CONTACT.support}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-honey-700" />
                <a href={`mailto:${LEGAL_CONTACT.privacy}`} className="font-semibold text-honey-800 hover:underline">
                  {LEGAL_CONTACT.privacy}
                </a>
              </p>
              <p className="col-span-full flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-honey-700" />
                {LEGAL_CONTACT.address}
              </p>
            </div>
          </div>

          {/* Cross links */}
          <div className="mt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-600/50">More legal honey</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {others.map((p) => (
                <Link
                  key={p.path}
                  href={p.path}
                  className="group rounded-2xl border border-cream-300 bg-white/85 p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-honey-400/60 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="flex items-center justify-between">
                    <p.icon size={15} className="text-honey-600" />
                    <ArrowUpRight size={13} className="text-ink-600/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-honey-700" />
                  </div>
                  <p className="mt-2.5 text-[13.5px] font-semibold leading-snug text-ink-950">{p.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-600/75">{p.blurb}</p>
                </Link>
              ))}
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-honey-700 hover:text-honey-800"
            >
              <ArrowRight size={13} className="rotate-180" /> Back to beevo.in
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
