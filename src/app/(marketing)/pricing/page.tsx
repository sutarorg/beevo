import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, ShieldCheck, ReceiptText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Button } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Pricing — Free ₹0 · Pro ₹799/month",
  description:
    "Beevo pricing in INR: a free forever plan and Beevo Pro at ₹799/month with unlimited posts, AI captions and best-time scheduling. GST invoice included.",
};

const ROWS: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Scheduled posts / month", free: "10", pro: "Unlimited" },
  { label: "Connected social accounts", free: "2", pro: "12" },
  { label: "Platforms", free: "All 6", pro: "All 6" },
  { label: "Visual calendar + drag reschedule", free: true, pro: true },
  { label: "Media library", free: "100 MB", pro: "25 GB" },
  { label: "Analytics history", free: "7 days", pro: "12 months" },
  { label: "Hive Writer AI captions", free: false, pro: true },
  { label: "Best-time-to-post engine", free: false, pro: true },
  { label: "Bulk scheduling & CSV import", free: false, pro: true },
  { label: "Team seats & approvals", free: false, pro: "3 seats" },
  { label: "Priority support", free: false, pro: true },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-16 comb-light">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(560px 300px at 50% 0%, rgba(245,163,1,0.16), transparent 62%)" }}
        />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-honey-700">Pricing · INR</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink-950 text-balance">
            Starts free. Stays{" "}
            <span className="font-display italic font-medium text-honey-600">honest.</span>
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-600">
            ₹0 forever for light schedulers. ₹799/month when your hive needs unlimited posts,
            AI captions and the best-time engine. GST invoice on every payment.
          </p>
        </div>
      </section>

      <section className="pb-10">
        <PricingCards />
      </section>

      {/* comparison table */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-ink-950">
          Compare every cell of the comb
        </h2>
        <div className="mt-10 overflow-hidden rounded-3xl border border-cream-300 bg-white/85 shadow-[var(--shadow-card)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-50/80 text-left">
                <th className="px-5 py-4 text-sm font-semibold text-ink-900">Feature</th>
                <th className="w-32 px-5 py-4 text-center text-sm font-semibold text-ink-900">Free</th>
                <th className="w-32 px-5 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-honey-400 to-honey-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-950">
                    Pro
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.label} className={cn("border-b border-cream-200/60 text-[13.5px] last:border-0", i % 2 === 1 && "bg-cream-50/50")}>
                  <td className="px-5 py-3.5 font-medium text-ink-800">{r.label}</td>
                  <td className="px-5 py-3.5 text-center text-ink-600/80"><Cell v={r.free} /></td>
                  <td className="px-5 py-3.5 text-center font-semibold text-ink-950"><Cell v={r.pro} highlight /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "14-day money-back", d: "Full refund if Pro isn't for you." },
            { icon: ReceiptText, t: "GST invoices", d: "18% GST breakdown on every email." },
            { icon: RefreshCw, t: "Cancel anytime", d: "Two clicks in Billing. No calls, no guilt." },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-3 rounded-2xl border border-cream-300 bg-white/80 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-honey-100 text-honey-700 border border-honey-300/60">
                <x.icon size={15} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-ink-950">{x.t}</p>
                <p className="text-xs text-ink-600/75">{x.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-ink-800 bg-ink-950 px-6 py-10 text-center text-cream-50 comb-dark sm:px-10">
          <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Unlimited posts for less than{" "}
            <span className="font-display italic text-honey-300">one boosted post.</span>
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-cream-50/60">
            ₹799/month · UPI, cards & net banking · cancel anytime.
          </p>
          <Link href="/signup?plan=pro" className="mt-6 inline-block">
            <Button size="lg">Start with Pro</Button>
          </Link>
        </div>
      </section>
    </>
  );
}

function Cell({ v, highlight = false }: { v: string | boolean; highlight?: boolean }) {
  if (v === true) return <Check size={15} className={cn("mx-auto", highlight ? "text-honey-600" : "text-leaf-600")} strokeWidth={3} />;
  if (v === false) return <Minus size={15} className="mx-auto text-ink-600/30" />;
  return <span className="tnum">{v}</span>;
}
