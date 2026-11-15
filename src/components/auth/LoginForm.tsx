"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { BeevoLogo } from "@/components/brand/BeevoLogo";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBackendNotice(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setErrorMessage(null);
    // Strict Phase 2 rule: never simulate authentication success before Phase 4 Supabase Auth connects.
    setBackendNotice(true);
  };

  return (
    <div className="rounded-[24px] border border-beevo-border bg-white p-6 shadow-beevo sm:p-9">
      <div className="flex flex-col items-center text-center">
        <BeevoLogo variant="icon" iconSize={34} />
        <h1 className="mt-4 font-display text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
          Welcome back to Beevo
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-beevo-muted">
          Sign in to access your storyboards, credit wallet, and finished videos.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-[13px] font-bold text-beevo-ink"
          >
            Email address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="you@example.com"
            className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="login-password"
              className="block text-[13px] font-bold text-beevo-ink"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="inline-flex min-h-[44px] items-center text-[12.5px] font-bold text-beevo-honey-text hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-0.5">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter your password"
              className="min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas pl-3.5 pr-12 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-beevo-muted transition-colors hover:text-beevo-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50/90 px-3.5 py-3 text-[13px] font-semibold text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {backendNotice && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-[12px] border border-beevo-border-warm bg-beevo-cream/85 px-3.5 py-3 text-[13px] leading-relaxed text-beevo-body"
          >
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold text-beevo-ink">
                Authentication connects in Phase 4
              </p>
              <p className="mt-0.5">
                Supabase SSR sign-in is not yet connected in this frontend workspace, so no
                session was created. You can inspect the Studio UI directly while backend auth is
                pending.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="beevo-btn-primary mt-2 min-h-[48px] w-full text-[14.5px]"
        >
          Log in
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-6 border-t border-beevo-border pt-5 text-center text-[13.5px] text-beevo-muted">
        New to Beevo?{" "}
        <Link
          href="/signup"
          className="inline-flex min-h-[44px] items-center font-bold text-beevo-ink underline decoration-beevo-yellow decoration-2 underline-offset-4 hover:text-beevo-honey-text"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
