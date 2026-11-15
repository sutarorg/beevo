import React from "react";
import { CreditsClient } from "@/components/studio/CreditsClient";
import { getInitialSessionData } from "@/lib/app-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Credits & Packs",
  description:
    "View your Beevo credit wallet and purchase simple one-time INR credit packs without subscriptions.",
  path: "/app/credits",
  noIndex: true,
});

export default function CreditsPage() {
  const session = getInitialSessionData();
  return (
    <CreditsClient
      wallet={session.data.wallet}
      connectionState={session.connectionState}
    />
  );
}
