"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Zap } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button, Input, Label } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [demoBusy, setDemoBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter your email and password");
    setBusy(true);
    try {
      await api.post("/api/auth/login", { email, password });
      toast.success("Welcome back to the hive");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusy(false);
    }
  }

  async function demoLogin() {
    setDemoBusy(true);
    try {
      await api.post("/api/auth/demo");
      toast.success("Welcome to the demo hive");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDemoBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back to the hive"
      subtitle="Your queue kept humming while you were away."
      quote={{
        text: "We went from three chaotic tabs to one calm calendar. Our Sunday reel hasn't missed in 8 months.",
        name: "Ritika Sharma",
        role: "Founder, Clay & Co.",
      }}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <button type="button" onClick={() => toast.success("Reset link sent (demo)")} className="cursor-pointer text-xs font-medium text-honey-700 hover:text-honey-800">
              Forgot password?
            </button>
          </div>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </div>
        <Button type="submit" size="lg" className="w-full" busy={busy}>
          Log in <ArrowRight size={15} />
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-full" busy={demoBusy} onClick={demoLogin}>
          <Zap size={15} className="text-honey-600" /> Explore the demo workspace
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-600/75">
        New to Beevo?{" "}
        <Link href="/signup" className="font-semibold text-honey-700 hover:text-honey-800">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}
