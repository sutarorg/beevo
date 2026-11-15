import React from "react";
import { AppShell } from "@/components/app/AppShell";

export default function StudioAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
