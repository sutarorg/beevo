import React from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Forgot Password",
  description: "Request a password reset email for your Beevo Studio account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
