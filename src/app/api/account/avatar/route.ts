import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { env } from "@/lib/server/env";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const MAX = 4 * 1024 * 1024; // 4 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = handler(async (req: Request) => {
  const { user } = await requireUser();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) throw new ApiError(400, "Attach an image under the `file` field");

  const ext = EXT[file.type];
  if (!ext) throw new ApiError(422, "Avatar must be a JPG, PNG or WebP image");
  if (file.size > MAX) throw new ApiError(422, "Avatar must be under 4 MB");

  const key = `beevo/avatars/${user.id}/${randomToken(10)}.${ext}`;
  let url: string;

  /*
   * Storage fallback chain — works on EVERY deployment, no 501s:
   *   1. Vercel Blob (when BLOB_READ_WRITE_TOKEN is configured)     → public CDN URL
   *   2. Local disk (self-hosted, ALLOW_LOCAL_UPLOADS=true)         → /api/uploads/…
   *   3. Database-inlined data URL (no storage env at all)          → users.avatar_url
   *      The client downscales to 256px (~100 KB), so option 3 is a
   *      production-safe stand-in on unconfigured Vercel projects.
   */
  if (env.blobToken()) {
    const blob = await put(key, file, { access: "public", token: env.blobToken(), contentType: file.type });
    url = blob.url;
  } else if (env.allowLocalUploads()) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `avatar_${randomToken(10)}.${ext}`;
    await writeFile(path.join(dir, filename), new Uint8Array(await file.arrayBuffer()));
    url = `/api/uploads/${filename}`;
  } else {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > 400_000) {
      throw new ApiError(
        422,
        "No object storage configured and the image is too large to store inline — add BLOB_READ_WRITE_TOKEN (README §4.12) or choose a smaller image."
      );
    }
    url = `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${bytes.toString("base64")}`;
    // `key` isn't an external storage object in this branch.
  }

  const [updated] = await db.update(users).set({ avatarUrl: url }).where(eq(users.id, user.id)).returning();
  return ok({ avatarUrl: updated.avatarUrl });
});

export const DELETE = handler(async () => {
  const { user } = await requireUser();
  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, user.id));
  return ok({ avatarUrl: null });
});
