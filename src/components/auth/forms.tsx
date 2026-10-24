"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { POST_AUTH_PATH } from "@/lib/config";
import {
  AUTH_UNAVAILABLE_MESSAGE,
  fetchSession,
  getAuthService,
} from "@/lib/services/auth";
import {
  firstError,
  validateFields,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type FieldErrors,
} from "@/lib/validation";
import {
  AuthCard,
  AuthStatePanel,
  FormErrorBanner,
} from "@/components/auth/states";
import { UnavailablePanel } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

function PasswordInput({
  id,
  value,
  onChange,
  invalid,
  autoComplete,
  placeholder = "••••••••",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoComplete: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        invalid={invalid}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-smoke transition-colors hover:text-ink"
      >
        {visible ? (
          <EyeOff className="size-4.5" aria-hidden="true" />
        ) : (
          <Eye className="size-4.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export function LoginForm({
  initialError,
  initialNotice,
  next,
}: {
  initialError?: string;
  initialNotice?: string;
  next?: string;
}) {
  const service = getAuthService();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(
    initialError ? { _form: [initialError] } : null,
  );
  const [notice] = useState(initialNotice ?? null);
  const [submitting, setSubmitting] = useState(false);

  if (!service) {
    return (
      <UnavailablePanel
        title="Authentication isn’t connected yet"
        message={AUTH_UNAVAILABLE_MESSAGE}
      />
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { values, fieldErrors: errors } = validateFields(loginSchema, {
      email,
      password,
    });
    if (!values) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors(null);
    setSubmitting(true);
    const result = await service!.signIn(values);
    setSubmitting(false);
    if (!result.ok) {
      setFieldErrors({ _form: [result.error.message] });
      toast.push({
        variant: "error",
        title: "Couldn’t sign you in",
        description: result.error.message,
      });
      return;
    }
    // The real session cookie is set server-side; go straight to the
    // destination. Platform admins land in the admin console instead of a
    // creator studio they may not use.
    const session = await fetchSession();
    toast.push({ variant: "success", title: "Signed in", description: "Welcome back." });
    window.location.assign(
      next && next.startsWith("/")
        ? next
        : session.isAdmin
          ? "/admin/dashboard"
          : POST_AUTH_PATH,
    );
  }

  return (
    <>
      <AuthCard
        title="Welcome back"
        subtitle="Log in to manage your profile, courses, and learners."
      >
        {notice ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border-2 border-ink bg-lime/60 p-3">
            <p className="text-sm font-bold text-ink">{notice}</p>
          </div>
        ) : null}
        {firstError(fieldErrors, "_form") ? (
          <FormErrorBanner message={firstError(fieldErrors, "_form")!} />
        ) : null}
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field
            id="login-email"
            label="Email"
            error={firstError(fieldErrors, "email")}
          >
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              invalid={Boolean(firstError(fieldErrors, "email"))}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field
            id="login-password"
            label="Password"
            error={firstError(fieldErrors, "password")}
          >
            <PasswordInput
              id="login-password"
              value={password}
              onChange={setPassword}
              invalid={Boolean(firstError(fieldErrors, "password"))}
              autoComplete="current-password"
            />
          </Field>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="link-underline text-sm font-semibold text-accent"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" variant="accent" size="lg" loading={submitting} className="w-full">
            {submitting ? "Checking…" : "Log in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-smoke">
          New to Beevo?{" "}
          <Link href="/signup" className="font-semibold text-accent underline underline-offset-4">
            Create a free account
          </Link>
        </p>
      </AuthCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

function VerifyPendingPanel({
  email,
  onRestart,
}: {
  email: string;
  onRestart: () => void;
}) {
  const service = getAuthService();
  const toast = useToast();
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    if (!service) return;
    setResending(true);
    await service.resendVerification(email);
    setResending(false);
    setCooldown(30);
    toast.push({
      variant: "info",
      title: "Verification email re-sent",
      description: "Check your inbox for the new link.",
    });
  }

  return (
    <AuthStatePanel
      tone="mail"
      title="Check your inbox"
      message={
        <>
          We sent a verification link to{" "}
          <span className="font-semibold text-ink">{email}</span>. Confirm it to
          activate your creator profile.
        </>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={resend}
        loading={resending}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend verification email"}
      </Button>
      <button
        type="button"
        onClick={onRestart}
        className="text-sm font-semibold text-accent underline underline-offset-4"
      >
        Wrong email? Start over
      </button>
    </AuthStatePanel>
  );
}

export function SignupForm() {
  const service = getAuthService();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  if (!service) {
    return (
      <AuthUnavailable title="Create your free account" />
    );
  }

  if (pendingEmail) {
    return (
      <VerifyPendingPanel email={pendingEmail} onRestart={() => setPendingEmail(null)} />
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { values, fieldErrors: errors } = validateFields(signupSchema, {
      fullName,
      email,
      password,
      acceptedTerms,
    });
    if (!values) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors(null);
    setSubmitting(true);
    const result = await service!.signUp(values);
    setSubmitting(false);
    if (!result.ok) {
      setFieldErrors({ _form: [result.error.message] });
      toast.push({
        variant: "error",
        title: "Couldn’t create the account",
        description: result.error.message,
      });
      return;
    }
    setPendingEmail(result.data.email);
  }

  return (
    <>
      <AuthCard
        title="Create your free account"
        subtitle="₹0/month forever. We earn 8% only when you make an eligible sale."
      >
        {firstError(fieldErrors, "_form") ? (
          <FormErrorBanner message={firstError(fieldErrors, "_form")!} />
        ) : null}
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field
            id="signup-name"
            label="Your name"
            error={firstError(fieldErrors, "fullName")}
          >
            <Input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              invalid={Boolean(firstError(fieldErrors, "fullName"))}
              autoComplete="name"
              placeholder="The name your audience knows"
            />
          </Field>
          <Field
            id="signup-email"
            label="Email"
            error={firstError(fieldErrors, "email")}
          >
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              invalid={Boolean(firstError(fieldErrors, "email"))}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field
            id="signup-password"
            label="Password"
            hint="At least 8 characters with one letter and one number."
            error={firstError(fieldErrors, "password")}
          >
            <PasswordInput
              id="signup-password"
              value={password}
              onChange={setPassword}
              invalid={Boolean(firstError(fieldErrors, "password"))}
              autoComplete="new-password"
            />
          </Field>
          <div>
            <label
              htmlFor="signup-terms"
              className="flex cursor-pointer items-start gap-3 text-sm text-smoke"
            >
              <input
                id="signup-terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="slider-accent mt-0.5 size-4.5 shrink-0 cursor-pointer"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-semibold text-accent underline underline-offset-2">
                  Terms of Service
                </Link>{" "}
                and the{" "}
                <Link href="/refund-policy" className="font-semibold text-accent underline underline-offset-2">
                  Refund Policy
                </Link>
                .
              </span>
            </label>
            {firstError(fieldErrors, "acceptedTerms") ? (
              <p role="alert" className="mt-1.5 text-xs font-semibold text-accent-deep">
                {firstError(fieldErrors, "acceptedTerms")}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="accent" size="lg" loading={submitting} className="w-full">
            {submitting ? "Creating account…" : "Start free"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-smoke">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent underline underline-offset-4">
            Log in
          </Link>
        </p>
      </AuthCard>
    </>
  );
}

function AuthUnavailable({ title }: { title: string }) {
  return (
    <div className="w-full max-w-md">
      <h1 className="sr-only">{title}</h1>
      <UnavailablePanel
        title="Authentication isn’t connected yet"
        message={AUTH_UNAVAILABLE_MESSAGE}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

export function ForgotPasswordForm() {
  const service = getAuthService();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!service) {
    return <AuthUnavailable title="Reset your password" />;
  }

  if (sentTo) {
    return (
      <AuthStatePanel
        tone="mail"
        title="Reset link sent"
        message={
          <>
            If an account exists for{" "}
            <span className="font-semibold text-ink">{sentTo}</span>, a
            password-reset link is on its way. It expires in 60 minutes.
          </>
        }
      >
        <Button href="/login" variant="ink" className="w-full">
          Back to log in
        </Button>
      </AuthStatePanel>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { values, fieldErrors: errors } = validateFields(
      forgotPasswordSchema,
      { email },
    );
    if (!values) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors(null);
    setSubmitting(true);
    const result = await service!.requestPasswordReset(values.email);
    setSubmitting(false);
    if (!result.ok) {
      toast.push({
        variant: "error",
        title: "Something went wrong",
        description: result.error.message,
      });
      return;
    }
    setSentTo(result.data.email);
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter the email you signed up with and we’ll send you a reset link."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="forgot-email"
          label="Email"
          error={firstError(fieldErrors, "email")}
        >
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(firstError(fieldErrors, "email"))}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Button type="submit" variant="accent" size="lg" loading={submitting} className="w-full">
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-smoke">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-accent underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}

// ---------------------------------------------------------------------------
// Reset password (completion)
// ---------------------------------------------------------------------------

export function ResetPasswordForm({ token }: { token: string }) {
  const service = getAuthService();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  if (!service) {
    return <AuthUnavailable title="Choose a new password" />;
  }

  if (!token) {
    return (
      <AuthStatePanel
        tone="error"
        title="This reset link isn’t valid"
        message="The link is missing its token. It may have been copied incompletely — request a fresh reset email and try again."
      >
        <Button href="/forgot-password" variant="accent" className="w-full">
          Request a new link
        </Button>
      </AuthStatePanel>
    );
  }

  if (tokenError) {
    return (
      <AuthStatePanel tone="error" title="This reset link has expired" message={tokenError}>
        <Button href="/forgot-password" variant="accent" className="w-full">
          Request a new link
        </Button>
      </AuthStatePanel>
    );
  }

  if (done) {
    return (
      <AuthStatePanel
        tone="success"
        title="Password updated"
        message="Your password has been changed. Use it to log back in."
      >
        <Button href="/login" variant="accent" className="w-full">
          Go to log in
        </Button>
      </AuthStatePanel>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { values, fieldErrors: errors } = validateFields(resetPasswordSchema, {
      password,
      confirmPassword,
    });
    if (!values) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors(null);
    setSubmitting(true);
    const result = await service!.completePasswordReset({
      token,
      password: values.password,
    });
    setSubmitting(false);
    if (!result.ok) {
      if (result.error.code === "invalid_reset_token") {
        setTokenError(result.error.message);
        return;
      }
      toast.push({
        variant: "error",
        title: "Couldn’t update the password",
        description: result.error.message,
      });
      return;
    }
    setDone(true);
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Make it strong — this guards your courses and your earnings."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="reset-password"
          label="New password"
          hint="At least 8 characters with one letter and one number."
          error={firstError(fieldErrors, "password")}
        >
          <PasswordInput
            id="reset-password"
            value={password}
            onChange={setPassword}
            invalid={Boolean(firstError(fieldErrors, "password"))}
            autoComplete="new-password"
          />
        </Field>
        <Field
          id="reset-confirm"
          label="Confirm new password"
          error={firstError(fieldErrors, "confirmPassword")}
        >
          <PasswordInput
            id="reset-confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            invalid={Boolean(firstError(fieldErrors, "confirmPassword"))}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" variant="accent" size="lg" loading={submitting} className="w-full">
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
