import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireEnv } from "@/lib/env";

let cachedR2Client: S3Client | null = null;

export const R2_ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "video/mp4",
  "text/plain",
  "text/vtt",
  "application/x-subrip",
  "application/json",
]);

export const R2_MAX_FILE_BYTES: Record<string, number> = {
  character_reference: 25 * 1024 * 1024,
  cartoon_image: 25 * 1024 * 1024,
  narration_track: 150 * 1024 * 1024,
  background_music: 50 * 1024 * 1024,
  sound_effect: 20 * 1024 * 1024,
  captions: 10 * 1024 * 1024,
  finished_mp4: 1024 * 1024 * 1024, // 1 GB max finished export
};

export function getR2Client(): S3Client {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY_VIOLATION: R2 client is strictly server-only.");
  }
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID", "Cloudflare R2");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY", "Cloudflare R2");
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    `https://${requireEnv("R2_ACCOUNT_ID", "Cloudflare R2")}.r2.cloudflarestorage.com`;

  if (!cachedR2Client) {
    cachedR2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return cachedR2Client;
}

export function getR2BucketName(): string {
  return requireEnv("R2_BUCKET_NAME", "Cloudflare R2");
}

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, "_");
}

/**
 * Canonical private Cloudflare R2 key convention:
 *  users/{user_id}/projects/{project_id}/{characters|scenes|audio|renders}/{filename}
 */
export function buildProjectR2Key(params: {
  userId: string;
  projectId: string;
  folder: "characters" | "scenes" | "audio" | "renders";
  fileName: string;
}): string {
  const uid = sanitizeSegment(params.userId);
  const pid = sanitizeSegment(params.projectId);
  const file = sanitizeSegment(params.fileName);
  return `users/${uid}/projects/${pid}/${params.folder}/${file}`;
}

export function validateR2Upload(params: {
  assetType: keyof typeof R2_MAX_FILE_BYTES;
  contentType: string;
  sizeBytes: number;
}): void {
  if (!R2_ALLOWED_MIME_TYPES.has(params.contentType)) {
    throw new Error(`Disallowed R2 upload content-type: "${params.contentType}".`);
  }
  if (params.sizeBytes <= 0) {
    throw new Error("Cannot upload an empty file to Cloudflare R2.");
  }
  const maxBytes = R2_MAX_FILE_BYTES[params.assetType] ?? 50 * 1024 * 1024;
  if (params.sizeBytes > maxBytes) {
    throw new Error(
      `File size ${params.sizeBytes} exceeds max limit ${maxBytes} bytes for ${params.assetType}.`
    );
  }
}

export async function uploadBufferToR2(params: {
  storageKey: string;
  body: Buffer | Uint8Array;
  contentType: string;
  assetType: keyof typeof R2_MAX_FILE_BYTES;
}): Promise<{ storageKey: string; sizeBytes: number; etag: string | null }> {
  validateR2Upload({
    assetType: params.assetType,
    contentType: params.contentType,
    sizeBytes: params.body.byteLength,
  });

  const client = getR2Client();
  const bucket = getR2BucketName();
  const res = await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.storageKey,
      Body: params.body,
      ContentType: params.contentType,
    })
  );

  return {
    storageKey: params.storageKey,
    sizeBytes: params.body.byteLength,
    etag: res.ETag ?? null,
  };
}

export async function downloadBufferFromR2(storageKey: string): Promise<Buffer> {
  const client = getR2Client();
  const bucket = getR2BucketName();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: storageKey }));
  if (!res.Body) {
    throw new Error(`R2 object missing body: ${storageKey}`);
  }
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function createSignedDownloadUrl(params: {
  storageKey: string;
  expiresInSeconds?: number;
  downloadFileName?: string;
}): Promise<{ url: string; expiresInSeconds: number }> {
  const client = getR2Client();
  const bucket = getR2BucketName();
  // Strictly enforce bounded expiry (max 1 hour for private user media)
  const expiresInSeconds = Math.min(Math.max(params.expiresInSeconds ?? 900, 60), 3600);

  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: params.storageKey,
    ...(params.downloadFileName
      ? {
          ResponseContentDisposition: `attachment; filename="${sanitizeSegment(params.downloadFileName)}"`,
        }
      : {}),
  });

  const url = await getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
  return { url, expiresInSeconds };
}

export async function headR2Object(storageKey: string): Promise<{
  exists: boolean;
  sizeBytes: number;
  contentType: string | null;
}> {
  const client = getR2Client();
  const bucket = getR2BucketName();
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey }));
    return {
      exists: true,
      sizeBytes: head.ContentLength ?? 0,
      contentType: head.ContentType ?? null,
    };
  } catch {
    return { exists: false, sizeBytes: 0, contentType: null };
  }
}

export async function deleteR2Object(storageKey: string): Promise<void> {
  const client = getR2Client();
  const bucket = getR2BucketName();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
}
