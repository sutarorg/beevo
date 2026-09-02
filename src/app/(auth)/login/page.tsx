"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton, AuthDivider } from "@/components/auth/google-button";
import { Button, Input, Label } from "@/components/ui/primitives";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  /* surface OAuth redirect errors (e.g. cancelled Google sign-in) */
  React.useEffect(() => {
    const err = params.get("error");
    if (err) {
      toast.error(decodeURIComponent(err));
      window.history.replaceState(null, "", "/login");
    }
  }, [params]);

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
      <GoogleButton disabled={busy} />
      <AuthDivider />

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <button type="button" onClick={() => toast.success("Reset link sent (if the email exists)")} className="cursor-pointer text-xs font-medium text-honey-700 hover:text-honey-800">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
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
          Log in <ArrowRight size={15} />
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

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  );
}
