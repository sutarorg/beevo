import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorStorefront } from "@/components/storefront/storefront-page";

/**
 * Storefront segments are `@handle`. Handles are stored lowercase, but links
 * get typed and re-shared in every case — normalise instead of 404-ing.
 */
function parseHandle(raw: string): string {
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("@")) notFound();
  const username = decoded.slice(1).trim().toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(username)) notFound();
  return username;
}

// Validating here (before the response shell streams) yields a real 404.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  parseHandle((await params).handle);
  return {
    title: "Creator storefront",
    robots: { index: false, follow: false },
  };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  return <CreatorStorefront handle={parseHandle((await params).handle)} />;
}
