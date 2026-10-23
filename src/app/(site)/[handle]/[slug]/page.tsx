import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseSalesPage } from "@/components/storefront/sales-page";

function parseHandle(raw: string): string {
  if (!raw.startsWith("@")) notFound();
  const username = decodeURIComponent(raw.slice(1));
  if (!/^[a-z0-9-]{1,40}$/.test(username)) notFound();
  return username;
}

// Validating here (before the response shell streams) yields a real 404.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}): Promise<Metadata> {
  parseHandle((await params).handle);
  return {
    title: "Course",
    robots: { index: false, follow: false },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  return <CourseSalesPage handle={parseHandle(handle)} slug={decodeURIComponent(slug)} />;
}
