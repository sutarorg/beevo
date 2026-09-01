import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { fail } from "@/lib/server/http";
import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/**
 * Serves locally-stored uploads when BLOB_READ_WRITE_TOKEN isn't configured
 * (self-hosted `next start`). Production (Vercel) prefers Blob URLs.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  if (!env.allowLocalUploads()) return fail("Local uploads are disabled", 404);
  const { key } = await ctx.params;
  // Strict basename — blocks path traversal.
  if (!/^[A-Za-z0-9_-]+\.[a-z0-9]{2,5}$/.test(key)) return fail("Not found", 404);
  const ext = key.split(".").pop()!.toLowerCase();
  const mime = MIME[ext];
  if (!mime) return fail("Not found", 404);

  const full = path.join(process.cwd(), "public", "uploads", key);
  try {
    await stat(full);
  } catch {
    return fail("Not found", 404);
  }
  const data = await readFile(full);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
