"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Info, Mail } from "lucide-react";
import { BeevoLogo } from "@/components/brand/BeevoLogo";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage("Please enter a valid account email address.");
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setStatusMessage(
          json?.error?.message ??
            "Password reset requires Supabase Auth credentials to be configured on this deployment."
        );
        return;
      }
      if (!res.ok) {
        setErrorMessage(json?.error?.message ?? "Could not request password reset.");
        return;
      }
      setStatusMessage(
        json?.message ?? "If an account exists for that email, a password reset link has been sent."
      );
    } catch {
      setErrorMessage("Network error while reaching Beevo password reset service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[24px] border border-beevo-border bg-white p-6 shadow-beevo sm:p-9">
      <div className="flex flex-col items-center text-center">
        <BeevoLogo variant="icon" iconSize={34} />
        <h1 className="mt-4 font-display text-[25px] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
          Reset your password
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-beevo-muted">
          Enter the email address associated with your Beevo account and we&apos;ll send a secure
          password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        <div>
          <label
            htmlFor="reset-email"
            className="block text-[13px] font-bold text-beevo-ink"
          >
            Email address
          </label>
          <input
            id="reset-email"
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

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50/90 px-3.5 py-3 text-[13px] font-semibold text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-[12px] border border-beevo-border-warm bg-beevo-cream/85 px-3.5 py-3 text-[13px] leading-relaxed text-beevo-body"
          >
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text"
              aria-hidden="true"
            />
            <span>{statusMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="beevo-btn-primary min-h-[48px] w-full text-[14.5px] disabled:opacity-60"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {submitting ? "Sending..." : "Send Reset Email"}
        </button>
      </form>

      <div className="mt-6 border-t border-beevo-border pt-5 text-center">
        <Link
          href="/login"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-bold text-beevo-ink hover:text-beevo-honey-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Log in
        </Link>
      </div>
    </div>
  );
}
