import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Beevo creator account.",
};

/** Maps auth-callback error codes to UI-safe banners. */
const ERROR_MESSAGES: Record<string, string> = {
  session_expired: "Your session expired. Please log in again.",
  callback_failed: "We couldn’t complete sign-in. Please try again.",
  access_denied: "Log in to continue to that page.",
  verification_failed: "That verification link is invalid or has expired. Request a new one after signing in.",
};

const NOTICE_MESSAGES: Record<string, string> = {
  verified: "Email verified — you're all set to log in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; notice?: string }>;
}) {
  const { error, next, notice } = await searchParams;
  const initialError = error ? ERROR_MESSAGES[error] : undefined;
  const initialNotice = notice ? NOTICE_MESSAGES[notice] : undefined;
  return <LoginForm initialError={initialError} initialNotice={initialNotice} next={next} />;
}
