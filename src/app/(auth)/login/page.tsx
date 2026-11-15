import React from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Log In to Beevo Studio",
  description: "Sign in to access your Beevo storyboards, credit wallet, and video exports.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <div>
      <LoginForm />
      <p className="mt-4 text-center text-[12.5px] text-beevo-muted">
        Inspecting the Phase 2 frontend workspace?{" "}
        <Link
          href="/app"
          className="inline-flex min-h-[44px] items-center font-semibold text-beevo-ink underline underline-offset-2 hover:text-beevo-honey-text"
        >
          Open Studio Workspace
        </Link>
      </p>
    </div>
  );
}
