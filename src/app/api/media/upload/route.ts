import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { env } from "@/lib/server/env";
import { randomToken } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const MAX_IMAGE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO = 50 * 1024 * 1024; // 50 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const POST = handler(async (req: Request) => {
  const { user, workspace, member } = await requireUser();
  if (member.role === "viewer") throw new ApiError(403, "Viewers can't upload media");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) throw new ApiError(400, "Attach a file under the `file` field");

  if (!ALLOWED.has(file.type)) throw new ApiError(422, `Unsupported file type: ${file.type}`);
  const isVideo = file.type.startsWith("video/");
  const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) throw new ApiError(422, `File too large — max ${Math.round(max / 1024 / 1024)} MB for ${isVideo ? "video" : "images"}`);

  const ext = EXT[file.type] ?? "bin";
  const key = `beevo/${workspace.id}/${randomToken(12)}.${ext}`;

  let url: string;
  if (env.blobToken()) {
    const blob = await put(key, file, { access: "public", token: env.blobToken(), contentType: file.type });
    url = blob.url;
  } else if (env.allowLocalUploads()) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomToken(12)}.${ext}`;
    await writeFile(path.join(dir, filename), new Uint8Array(await file.arrayBuffer()));
    url = `/api/uploads/${filename}`;
  } else {
    throw new ApiError(501, "Uploads need BLOB_READ_WRITE_TOKEN on this deployment (local disk is ephemeral)");
  }

  const [asset] = await db
    .insert(mediaAssets)
    .values({
      workspaceId: workspace.id,
      uploadedById: user.id,
      url,
      storageKey: key,
      name: file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "Upload",
      mime: file.type,
      size: file.size,
    })
    .returning();

  return ok(
    {
      asset: {
        id: asset.id,
        src: asset.url,
        label: asset.name,
        kind: isVideo ? "video" : "image",
        tags: [],
        usedIn: 0,
      },
    },
    201
  );
});
