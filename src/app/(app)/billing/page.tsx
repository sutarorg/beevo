"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Crown,
  Check,
  Download,
  CreditCard,
  Smartphone,
  ShieldCheck,
  ReceiptText,
  Infinity as InfinityIcon,
  Sparkles,
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { GST_RATE, PLANS } from "@/lib/constants";
import { Badge, Button, Card, CardHeader, Meter, Modal, Skeleton } from "@/components/ui/primitives";
import { BeeMark } from "@/components/brand/bee-mark";
import { useApp } from "@/providers/app-provider";
import type { PlanId } from "@/lib/types";

export default function BillingPage() {
  const { ready, plan, billing, setPlan, user } = useApp();
  const [checkout, setCheckout] = React.useState(false);
  const [downgrade, setDowngrade] = React.useState(false);
  const [payPhase, setPayPhase] = React.useState<"choose" | "working" | "done">("choose");
  const [method, setMethod] = React.useState<"upi" | "card">("upi");

  const gst = Math.round(799 * GST_RATE * 100) / 100;
  const total = 799 + gst;

  async function pay() {
    setPayPhase("working");
    // Real Razorpay checkout when keys are configured, demo activation otherwise.
    await setPlan("pro");
    setPayPhase("done");
    setTimeout(() => setCheckout(false), 900);
  }

  function openCheckoutFor(target: PlanId) {
    if (target === plan) return;
    if (target === "pro") {
      setPayPhase("choose");
      setCheckout(true);
    } else {
      setDowngrade(true);
    }
  }

  if (!ready || !billing)
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* current plan hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border px-6 py-6 sm:px-8",
          plan === "pro"
            ? "border-honey-500/50 bg-gradient-to-br from-honey-300 via-honey-400 to-honey-600 text-ink-950 comb-gold"
            : "border-ink-800 bg-ink-900 text-cream-50 comb-dark"
        )}
      >
        <div className="flex flex-wrap items-center gap-6">
          <BeeMark size={56} withHex={plan !== "pro"} />
          <div className="min-w-0 flex-1">
            <p className={cn("font-mono text-[10px] uppercase tracking-[0.22em]", plan === "pro" ? "text-ink-950/60" : "text-honey-400")}>
              Current plan
            </p>
            <h2 className="mt-1 flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
              {plan === "pro" ? "Beevo Pro" : "Beevo Free"}
              {plan === "pro" && <Crown size={20} />}
            </h2>
            <p className={cn("mt-1 text-sm", plan === "pro" ? "text-ink-950/75" : "text-cream-50/60")}>
              {plan === "pro"
                ? `₹799/month · renews ${billing.renewsOn ? new Date(billing.renewsOn).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "soon"}`
                : "₹0 forever · upgrade anytime to unlock the full hive"}
            </p>
          </div>
          <div className="w-full max-w-xs space-y-3 sm:w-auto">
            {plan === "free" ? (
              <>
                <div className="min-w-56">
                  <div className="flex justify-between text-xs">
                    <span>Posts this month</span>
                    <span className="tnum font-mono">{billing.usage.postsThisMonth}/{billing.usage.postsLimit}</span>
                  </div>
                  <Meter value={billing.usage.postsThisMonth} max={billing.usage.postsLimit ?? 10} className="mt-1.5 !bg-white/15" />
                </div>
                <Button onClick={() => openCheckoutFor("pro")}>
                  <Sparkles size={15} /> Upgrade — {formatINR(799)}/mo
                </Button>
              </>
            ) : (
              <Button variant="white" onClick={() => setDowngrade(true)}>
                Manage subscription
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      {/* plan chooser */}
      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((p, i) => {
          const current = p.id === plan;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07 }}>
              <Card className={cn("relative flex h-full flex-col p-6", p.id === "pro" && "border-honey-500/60 ring-2 ring-honey-500/20", current && "border-honey-600/50")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold tracking-tight text-ink-950">{p.name}</p>
                    {p.id === "pro" && <Crown size={15} className="text-honey-600" />}
                  </div>
                  {current ? <Badge tone="gold">Current plan</Badge> : p.id === "pro" ? <Badge tone="ink">Most popular</Badge> : null}
                </div>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="tnum text-4xl font-bold tracking-tight text-ink-950">{formatINR(p.priceInr)}</span>
                  <span className="pb-1 text-sm text-ink-600/70">/ {p.cadence === "forever" ? "forever" : "month"}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600/80">{p.blurb}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f.label} className={cn("flex items-center gap-2 text-[13px]", f.included ? "text-ink-800" : "text-ink-600/45 line-through decoration-cream-300")}>
                      {f.included ? (
                        <Check size={14} className="shrink-0 text-leaf-600" />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-cream-300" />
                      )}
                      {f.label}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={current ? "outline" : p.id === "pro" ? "primary" : "dark"}
                  disabled={current}
                  onClick={() => openCheckoutFor(p.id)}
                >
                  {current ? "Your plan" : p.id === "pro" ? `Upgrade — ${formatINR(p.priceInr)}/mo` : "Switch to Free"}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* payment + invoices */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Payment methods" subtitle="Cards & UPI on file" />
          <div className="space-y-2.5 px-5 pb-5">
            <div className="flex items-center gap-3 rounded-xl border border-cream-300 bg-white p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-honey-400">
                <CreditCard size={16} />
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-ink-900">HDFC Visa •••• 4282</p>
                <p className="font-mono text-[10px] text-ink-600/55">expires 09/28</p>
              </div>
              <Badge tone="green">Default</Badge>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-cream-300 bg-white p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-honey-100 text-honey-700 border border-honey-300/50">
                <Smartphone size={16} />
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-ink-900">aarushi@okhdfc UPI</p>
                <p className="font-mono text-[10px] text-ink-600/55">autopay enabled</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => toast.success("Payment methods are mocked in this demo")}
            >
              + Add payment method
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Invoices"
            subtitle="GST invoices for every payment"
            action={<Badge tone="neutral"><ReceiptText size={11} /> GSTIN 29BEEVO2026K1Z5</Badge>}
          />
          <div className="px-2.5 pb-3">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-cream-200/70 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-600/55">
                  <th className="px-3 py-2 font-medium">Invoice</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Description</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {billing.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-cream-200/50 text-[13px] last:border-0 hover:bg-honey-50/40">
                    <td className="px-3 py-3 font-mono text-[11.5px] text-ink-800">{inv.id}</td>
                    <td className="px-3 py-3 text-ink-700">
                      {new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="hidden px-3 py-3 text-ink-600/80 sm:table-cell">{inv.description}</td>
                    <td className="tnum px-3 py-3 text-right font-semibold text-ink-900">{formatINR(inv.amountInr)}</td>
                    <td className="px-3 py-3 text-right">
                      <Badge tone="green">{inv.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => toast.success(`Invoice ${inv.id} downloaded (demo)`)}
                        className="cursor-pointer rounded-lg p-1.5 text-ink-600/60 hover:bg-honey-100 hover:text-honey-800"
                        aria-label="Download invoice"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* checkout modal */}
      <Modal open={checkout} onClose={() => payPhase !== "working" && setCheckout(false)} size="sm">
        <div className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-950">
            <Crown size={18} className="text-honey-600" /> Checkout — Beevo Pro
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-600/75">Secured by BeevoPay · auto-renews monthly</p>

          <div className="mt-4 space-y-2 rounded-2xl border border-cream-300 bg-white p-4 text-[13px]">
            <Row label="Beevo Pro · monthly" value={formatINR(799)} />
            <Row label={`GST (18%) · for ${user?.email ?? "you"}`} value={formatINR(gst, { decimals: 2 })} />
            <div className="my-1 border-t border-dashed border-cream-300" />
            <Row label="Total due today" value={formatINR(total, { decimals: 2 })} bold />
            <p className="pt-1 font-mono text-[10px] uppercase tracking-wide text-ink-600/50">
              Next renewal: {formatINR(total, { decimals: 2 })} in 30 days
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(
              [
                { id: "upi", label: "UPI / GPay", icon: Smartphone },
                { id: "card", label: "Visa •••• 4282", icon: CreditCard },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-3 text-[13px] font-medium transition-all",
                  method === m.id
                    ? "border-honey-500/70 bg-honey-50 text-ink-950 ring-2 ring-honey-500/20"
                    : "border-cream-300 bg-white text-ink-700 hover:border-honey-400/50"
                )}
              >
                <m.icon size={15} className={method === m.id ? "text-honey-700" : "opacity-60"} />
                {m.label}
                {method === m.id && <Check size={13} className="ml-auto text-honey-700" />}
              </button>
            ))}
          </div>

          <Button className="mt-5 w-full" size="lg" busy={payPhase === "working"} onClick={pay}>
            {payPhase === "working"
              ? "Contacting your bank…"
              : payPhase === "done"
                ? "Payment successful"
                : `Pay ${formatINR(total, { decimals: 2 })}`}
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-600/60">
            <ShieldCheck size={12} className="text-leaf-600" /> 256-bit encrypted · PCI-DSS compliant · cancel anytime
          </div>
        </div>
      </Modal>

      {/* downgrade modal */}
      <Modal open={downgrade} onClose={() => setDowngrade(false)} size="sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold tracking-tight text-ink-950">
            {plan === "pro" ? "Switch back to Free?" : "Manage subscription"}
          </h3>
          {plan === "pro" ? (
            <>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600/85">
                You'll keep Pro until the end of this billing cycle, then move to Free:
                10 posts/month and 2 connected accounts. Scheduled posts beyond the
                limit stay published but new scheduling pauses.
              </p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDowngrade(false)}>
                  Keep Pro
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={async () => {
                    await setPlan("free");
                    setDowngrade(false);
                  }}
                >
                  Downgrade to Free
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600/85">
                You're on the Free plan with {formatINR(0)} billing. Upgrade to Pro for
                unlimited posts, Hive Writer and best-time scheduling.
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  setDowngrade(false);
                  openCheckoutFor("pro");
                }}
              >
                <InfinityIcon size={15} /> Upgrade to Pro
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink-950" : "text-ink-700"}>{label}</span>
      <span className={cn("tnum", bold ? "text-[15px] font-bold text-ink-950" : "text-ink-800")}>{value}</span>
    </div>
  );
}
