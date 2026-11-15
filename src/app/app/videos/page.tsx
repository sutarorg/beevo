import React from "react";
import { VideosLibraryClient } from "@/components/studio/VideosLibraryClient";
import { getUserVideos } from "@/lib/app-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "My Videos",
  description: "Search, filter, preview, and download your completed Beevo animated cartoon videos.",
  path: "/app/videos",
  noIndex: true,
});

export default function VideosPage() {
  const result = getUserVideos();
  return <VideosLibraryClient initialVideos={result.data} />;
}
