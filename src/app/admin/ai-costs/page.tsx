import React from "react";
import { AiCostsClient } from "@/components/admin/AiCostsClient";
import { getAdminAiCosts } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — AI Costs & Profitability",
  description:
    "Track OpenAI, fal.ai, ElevenLabs, FFmpeg worker compute, Cloudflare R2 storage, and Beevo contribution margin.",
  path: "/admin/ai-costs",
  noIndex: true,
});

export default function AdminAiCostsPage() {
  const response = getAdminAiCosts();
  return (
    <AiCostsClient
      apiState={response.state}
      apiError={response.error}
      snapshot={response.data}
    />
  );
}
