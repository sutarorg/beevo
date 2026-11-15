import React from "react";
import { MediaLibraryClient } from "@/components/admin/MediaLibraryClient";
import { getAdminMediaAssets } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Media Library",
  description:
    "Manage Cloudflare R2 character references, generated cartoon images, narration audio, captions, and MP4 exports.",
  path: "/admin/media-library",
  noIndex: true,
});

export default function AdminMediaLibraryPage() {
  const response = getAdminMediaAssets();
  return (
    <MediaLibraryClient
      apiState={response.state}
      apiError={response.error}
      initialAssets={response.data}
    />
  );
}
