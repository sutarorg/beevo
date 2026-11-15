import React from "react";
import { StoryboardWorkspaceClient } from "@/components/studio/StoryboardWorkspaceClient";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Storyboard Review Workspace",
  description:
    "Review and edit your Beevo script, Visual Style Bible, character references, and dynamic scene storyboard.",
  path: "/app/projects/storyboard",
  noIndex: true,
});

export default async function ProjectStoryboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StoryboardWorkspaceClient projectId={id} />;
}
