"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, Crown, Check, Sparkles, CalendarClock, Wand2, Users, BarChart3, Infinity as InfinityIcon } from "lucide-react";
import { priceFor } from "@/lib/pricing";
import { Button, Modal } from "@/components/ui/primitives";
import { BeeMark } from "@/components/brand/bee-mark";
import { useApp } from "@/providers/app-provider";

const PRICE = priceFor("monthly");

const REASON_COPY: Record<string, { title: string; body: string }> = {
  "post-limit": {
    title: "You've used all 10 free posts this month",
    body: "The Free plan allows 10 scheduled posts per month. Go Pro for unlimited scheduling.",
  },
  accounts: {
    title: "Free plan includes 2 connected accounts",
    body: "Connect up to 12 social accounts across all six platforms with Beevo Pro.",
  },
  ai: { title: "Hive Writer is a Pro feature", body: "Generate on-brand captions in seconds with the AI assistant." },
  "best-time": { title: "Best-time engine is a Pro feature", body: "We analyse when your audience is online and auto-suggest scheduling slots." },
  analytics: { title: "Full analytics are a Pro feature", body: "Unlock 12-month history, exports and best-time heatmaps." },
  sidebar: { title: "Supercharge your hive", body: "Everything in Free, plus unlimited posts, AI and deep analytics." },
};

const PRO_FEATURES = [
  { icon: InfinityIcon, label: "Unlimited scheduled posts" },
  { icon: CalendarClock, label: "Best-time-to-post engine" },
  { icon: Wand2, label: "AI caption assistant" },
  { icon: BarChart3, label: "12-month analytics & exports" },
  { icon: Users, label: "3 team seats & approvals" },
];

export function UpgradeModal() {
  const { upgrade, closeUpgrade, setPlan, plan } = useApp();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (upgrade.open) {
      setDone(plan === "pro");
      setBusy(false);
    }
  }, [upgrade.open, plan]);

  const copy = REASON_COPY[upgrade.reason ?? "sidebar"] ?? REASON_COPY.sidebar;

  async function upgradeNow() {
    setBusy(true);
    try {
      await setPlan("pro"); // Razorpay checkout when configured, demo activation otherwise
    } finally {
      setBusy(false);
      setDone(true);
    }
  }

  return (
    <Modal open={upgrade.open} onClose={closeUpgrade} size="sm">
      <div className="relative overflow-hidden">
        {/* gold comb header */}
        <div className="relative bg-gradient-to-br from-honey-300 via-honey-400 to-honey-600 px-6 pb-14 pt-8 text-center comb-gold">
          <button
            onClick={closeUpgrade}
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-ink-950/10 p-1.5 text-ink-950/70 transition-colors hover:bg-ink-950/20"
          >
            <X size={16} />
          </button>
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto flex justify-center"
          >
            <BeeMark size={64} withHex={false} className="drop-shadow-lg" />
          </motion.div>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-honey-400">
            <Crown size={11} /> Beevo Pro
          </p>
        </div>

        <div className="-mt-8 rounded-t-3xl bg-cream-50 px-6 pb-6 pt-6">
          {done ? (
            <div className="py-4 text-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-honey-400 to-honey-600 text-ink-950 shadow-[var(--shadow-gold)]"
              >
                <Check size={30} strokeWidth={3} />
              </motion.span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink-950">Welcome to the full hive</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink-600/85">
                Unlimited posts, Hive Writer and the best-time engine are now active on your workspace.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="outline" onClick={closeUpgrade}>Keep planning</Button>
                <Button onClick={() => { closeUpgrade(); router.push("/billing"); }}>View billing</Button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-center text-lg font-semibold tracking-tight text-ink-950 text-balance">
                {copy.title}
              </h3>
              <p className="mx-auto mt-1.5 max-w-sm text-center text-[13px] leading-relaxed text-ink-600/85">
                {copy.body}
              </p>

              <div className="mt-4 flex items-end justify-center gap-1.5">
                <span className="tnum text-4xl font-bold tracking-tight text-ink-950">{PRICE.base}</span>
                <span className="pb-1 text-sm text-ink-600/70">/ month</span>
              </div>
              <p className="mt-0.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-600/55">
                + 18% GST {PRICE.gst} = {PRICE.total} / month · cancel anytime
              </p>

              <ul className="mt-5 space-y-2">
                {PRO_FEATURES.map((f, i) => (
                  <motion.li
                    key={f.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className="flex items-center gap-2.5 rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-ink-800"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-honey-100 text-honey-700">
                      <f.icon size={13} />
                    </span>
                    {f.label}
                    <Check size={14} className="ml-auto text-leaf-600" />
                  </motion.li>
                ))}
              </ul>

              <Button className="mt-5 w-full" size="lg" busy={busy} onClick={upgradeNow}>
                <Sparkles size={16} />
                {busy ? "Processing payment…" : `Upgrade now — ${PRICE.total}/mo`}
              </Button>
              <p className="mt-2.5 text-center text-[11px] text-ink-600/60">
                Secured checkout · UPI, cards & net banking · GST invoice emailed
              </p>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
