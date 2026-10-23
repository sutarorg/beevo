import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password-reset link for your CourseKit account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
