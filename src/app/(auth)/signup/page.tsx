"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Check, Crown, Eye, EyeOff } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton, AuthDivider } from "@/components/auth/google-button";
import { Button, Input, Label } from "@/components/ui/primitives";
import type { PlanId } from "@/lib/types";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [plan, setPlan] = React.useState<PlanId>(params.get("plan") === "pro" ? "pro" : "free");
  const [name, setName] = React.useState("");
  const [workspace, setWorkspace] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Fill in all fields to join the hive");
    setBusy(true);
    try {
      await api.post("/api/auth/signup", {
        name,
        email,
        password,
        workspaceName: workspace || undefined,
        plan,
      });
      toast.success("Hive created — welcome aboard");
      router.push(plan === "pro" ? "/billing" : "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Start your hive free"
      subtitle="₹0 forever · no card required · 2-minute setup."
    >
      {/* plan picker */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        {(
          [
            { id: "free", name: "Free", price: formatINR(0), note: "forever", perks: ["10 posts/mo", "2 accounts"] },
            { id: "pro", name: "Pro", price: formatINR(799), note: "/month + GST", perks: ["Unlimited posts", "AI + best-time"] },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p.id)}
            className={cn(
              "cursor-pointer rounded-2xl border p-3.5 text-left transition-all",
              plan === p.id
                ? "border-honey-500/70 bg-honey-50 ring-2 ring-honey-500/25"
                : "border-cream-300 bg-white/70 hover:border-honey-400/50"
            )}
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink-950">
                {p.name}
                {p.id === "pro" && <Crown size={12} className="text-honey-600" />}
              </span>
              {plan === p.id && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-honey-500 text-ink-950">
                  <Check size={10} strokeWidth={3.5} />
                </span>
              )}
            </span>
            <span className="tnum mt-1 block text-lg font-bold text-ink-950">
              {p.price} <span className="text-[10px] font-medium text-ink-600/60">{p.note}</span>
            </span>
            <span className="mt-0.5 block text-[11px] text-ink-600/70">{p.perks.join(" · ")}</span>
          </button>
        ))}
      </div>

      <GoogleButton disabled={busy} />
      <AuthDivider />

      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Your name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarushi Mehta" autoComplete="name" />
          </div>
          <div>
            <Label>Brand / workspace</Label>
            <Input value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="Beevo Studio" />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" autoComplete="email" />
        </div>
        <div>
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              autoComplete="new-password"
              className="!pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-ink-600/50 transition-colors hover:text-ink-900"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" busy={busy}>
          {plan === "pro" ? "Create hive & start Pro" : "Create free hive"} <ArrowRight size={15} />
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-ink-600/60">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="font-semibold text-honey-700 hover:text-honey-800">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-honey-700 hover:text-honey-800">
            Privacy Policy
          </Link>
          .
          {plan === "pro" ? " Pro starts after a free 14-day trial — we'll remind you before billing." : ""}
        </p>
      </form>
      <p className="mt-5 text-center text-sm text-ink-600/75">
        Already keeping bees with us?{" "}
        <Link href="/login" className="font-semibold text-honey-700 hover:text-honey-800">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense>
      <SignupForm />
    </React.Suspense>
  );
}
