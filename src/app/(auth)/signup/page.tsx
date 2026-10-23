import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/forms";

export const metadata: Metadata = {
  title: "Create a free account",
  description:
    "Create your free CourseKit account — ₹0/month, 8% commission only on successful eligible sales.",
};

export default function SignupPage() {
  return <SignupForm />;
}
