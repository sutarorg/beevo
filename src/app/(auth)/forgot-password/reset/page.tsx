import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Complete your CourseKit password reset.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
