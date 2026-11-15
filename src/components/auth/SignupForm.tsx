"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Info } from "lucide-react";
import { BeevoLogo } from "@/components/brand/BeevoLogo";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetterAndNumber = /[a-zA-Z]/.test(password) && /\d/.test(password);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBackendNotice(false);

    if (fullName.trim().length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!hasMinLength || !hasLetterAndNumber) {
      setErrorMessage("Password must be at least 8 characters and include a letter and a number.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please check and try again.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage("Please accept Beevo's Terms of Service and Privacy Policy to continue.");
      return;
    }

    setErrorMessage(null);
    // Strict Phase 2 rule: never simulate signup success before Supabase Auth connects in Phase 4.
    setBackendNotice(true);
  };

  return (
    <div className="rounded-[24px] border border-beevo-border bg-white p-6 shadow-beevo sm:p-9">
      <div className="flex flex-col items-center text-center">
        <BeevoLogo variant="icon" iconSize={34} />
        <h1 className="mt-4 font-display text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
          Create your Beevo account
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-beevo-muted">
          Set up your private workspace for illustrated cartoon storytelling. No subscription
          required.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        <div>
          <label
            htmlFor="signup-name"
            className="block text-[13px] font-bold text-beevo-ink"
          >
            Full name
          </label>
          <input
            id="signup-name"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Your name"
            className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-[13px] font-bold text-beevo-ink"
          >
            Email address
          </label>
          <input
            id="signup-email"
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
          <label
            htmlFor="signup-password"
            className="block text-[13px] font-bold text-beevo-ink"
          >
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="At least 8 characters"
              className="min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas pl-3.5 pr-12 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-beevo-muted hover:text-beevo-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold">
            <li
              className={`inline-flex items-center gap-1 ${
                hasMinLength ? "text-emerald-700" : "text-beevo-muted"
              }`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              8+ characters
            </li>
            <li
              className={`inline-flex items-center gap-1 ${
                hasLetterAndNumber ? "text-emerald-700" : "text-beevo-muted"
              }`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Letter &amp; number
            </li>
          </ul>
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-[13px] font-bold text-beevo-ink"
          >
            Confirm password
          </label>
          <div className="relative mt-1.5">
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Re-enter your password"
              className="min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas pl-3.5 pr-12 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              aria-pressed={showConfirm}
              className="absolute right-1 top-1/2 flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-beevo-muted hover:text-beevo-ink"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-[12px] border border-beevo-border/80 bg-beevo-canvas/80 p-3 text-[13px] leading-snug text-beevo-body">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              if (errorMessage) setErrorMessage(null);
            }}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-beevo-border accent-[#FFC928]"
          />
          <span>
            I agree to Beevo&apos;s{" "}
            <Link href="/terms" className="font-bold text-beevo-ink underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-bold text-beevo-ink underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

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
              <p className="font-bold text-beevo-ink">Account creation connects in Phase 4</p>
              <p className="mt-0.5">
                Your form inputs passed client validation, but Supabase Auth is not connected yet
                so no account was created.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="beevo-btn-primary mt-1 min-h-[48px] w-full text-[14.5px]"
        >
          Create Account
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-6 border-t border-beevo-border pt-5 text-center text-[13.5px] text-beevo-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-[44px] items-center font-bold text-beevo-ink underline decoration-beevo-yellow decoration-2 underline-offset-4 hover:text-beevo-honey-text"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
