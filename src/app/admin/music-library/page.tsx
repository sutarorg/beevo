import React from "react";
import { MusicLibraryClient } from "@/components/admin/MusicLibraryClient";
import { getAdminMusicTracks } from "@/lib/admin-api";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Admin — Music & Audio Library",
  description:
    "Manage commercially licensed background music tracks and sound effects with verified usage rights.",
  path: "/admin/music-library",
  noIndex: true,
});

export default function AdminMusicLibraryPage() {
  const response = getAdminMusicTracks();
  return (
    <MusicLibraryClient
      apiState={response.state}
      apiError={response.error}
      initialTracks={response.data}
    />
  );
}
