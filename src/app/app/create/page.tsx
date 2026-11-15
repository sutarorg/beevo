import React from "react";
import { CreateStudioClient } from "@/components/studio/CreateStudioClient";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Create Video Studio",
  description:
    "Write your story idea, pick a cartoon illustration style, configure narration and captions, and launch your storyboard.",
  path: "/app/create",
  noIndex: true,
});

export default function CreateVideoPage() {
  return <CreateStudioClient />;
}
