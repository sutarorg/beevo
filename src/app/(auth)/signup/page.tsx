import React from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Create Your Beevo Account",
  description: "Sign up for Beevo to start creating illustrated cartoon videos with one-time credits.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return <SignupForm />;
}
