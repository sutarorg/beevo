import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { IS_PROD, R2 } from "@/server/env";

/**
 * Cloudflare R2 (S3 API) — hand-rolled SigV4 presigning, no SDK needed.
 *
 * SECURITY RULES (enforced here + by callers):
 *  - storage keys are server-generated only; client-supplied keys are never
 *    signed (delivery goes through authorizeMediaAccess which derives the key
 *    from the database row after an authorization check);
 *  - upload URLs live ≤15 min; delivery URLs ≤10 min;
 *  - credentials never leave the server; keys only reach the client as part
 *    of an already-authorized, short-lived URL;
 *  - videos/resources are always private; presigned GET + range support is
 *    provided by R2 directly (direct MP4 delivery; no transcoding on R2, and
 *    no HLS pipeline is required for the initial product);
 *  - bucket CORS must allow PUT/POST/GET/HEAD/DELETE with content-type and
 *    x-amz-content-sha256, and expose ETag for direct multipart uploads.
 */

const SERVICE = "s3";
const REGION = "auto";

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function hmacHex(key: Buffer | string, data: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function keyFor(date: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${R2.secretAccessKey}`, date), REGION), SERVICE), "aws4_request");
}

function host(): string {
  return `${R2.accountId}.r2.cloudflarestorage.com`;
}

/** Strict RFC 3986 percent-encoding required by AWS Signature Version 4. */
function rfc3986Encode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function uriEncodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => rfc3986Encode(segment))
    .join("/");
}

function buildCanonicalQueryString(entries: [string, string][]): string {
  return [...entries]
    .sort(([keyA, valA], [keyB, valB]) => {
      if (keyA !== keyB) return keyA < keyB ? -1 : 1;
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    })
    .map(([k, v]) => `${rfc3986Encode(k)}=${rfc3986Encode(v)}`)
    .join("&");
}

export function presignUrl(input: {
  method: "PUT" | "POST" | "GET" | "HEAD" | "DELETE";
  key: string;
  expiresSeconds: number;
  contentType?: string;
  query?: Record<string, string | number>;
  responseContentDisposition?: string;
}): { url: string; expiresAt: string } {
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const credential = `${R2.accessKeyId}/${credentialScope}`;
  const canonicalUri = `/${rfc3986Encode(R2.bucket)}/${uriEncodePath(input.key)}`;

  const signedHeaders = input.contentType ? "content-type;host" : "host";
  const queryEntries: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(input.expiresSeconds)],
    ["X-Amz-SignedHeaders", signedHeaders],
  ];
  for (const [key, value] of Object.entries(input.query ?? {})) {
    queryEntries.push([key, String(value)]);
  }
  if (input.responseContentDisposition) {
    queryEntries.push(["response-content-disposition", input.responseContentDisposition]);
  }
  const canonicalQuery = buildCanonicalQueryString(queryEntries);

  const canonicalHeaders = input.contentType
    ? `content-type:${input.contentType.trim()}\nhost:${host()}\n`
    : `host:${host()}\n`;
  const canonicalRequest = [
    input.method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = hmacHex(keyFor(dateStamp), stringToSign);
  const url = `https://${host()}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  return { url, expiresAt: new Date(now.getTime() + input.expiresSeconds * 1000).toISOString() };
}

/**
 * Server-side object write (fallback path only).
 *
 * Browsers normally PUT straight to a presigned R2 URL. Large files use the
 * multipart path below. When a small direct PUT is impossible (bucket CORS not
 * yet configured, a network middlebox stripping the request, …) the client can
 * relay the bytes through the app instead; this performs the actual R2 write.
 */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<boolean> {
  if (!R2.configured) return false;
  const { url } = presignUrl({ method: "PUT", key, expiresSeconds: 300, contentType });
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "content-type": contentType },
      body: new Uint8Array(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Multipart uploads keep every browser request small enough to avoid CDN and
 * serverless request-body limits. Only the tiny signing/completion requests
 * pass through the app; file bytes always go directly between the browser and
 * the same R2 bucket.
 */
export const MULTIPART_PART_SIZE_BYTES = 16 * 1024 * 1024;

function decodeXmlValue(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeXmlValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function createMultipartUpload(
  key: string,
  contentType: string,
): Promise<string | null> {
  if (!R2.configured) return null;
  const { url } = presignUrl({
    method: "POST",
    key,
    expiresSeconds: 300,
    contentType,
    query: { uploads: "" },
  });
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": contentType } });
    const xml = await res.text();
    if (!res.ok) return null;
    const uploadId = xml.match(/<UploadId>([\s\S]*?)<\/UploadId>/i)?.[1]?.trim();
    return uploadId ? decodeXmlValue(uploadId) : null;
  } catch {
    return null;
  }
}

export function presignMultipartPart(input: {
  key: string;
  uploadId: string;
  partNumber: number;
  contentType: string;
}): { url: string; expiresAt: string } {
  return presignUrl({
    method: "PUT",
    key: input.key,
    expiresSeconds: 900,
    contentType: input.contentType,
    query: { partNumber: input.partNumber, uploadId: input.uploadId },
  });
}

export async function completeMultipartUpload(input: {
  key: string;
  uploadId: string;
  parts: { partNumber: number; etag: string }[];
}): Promise<boolean> {
  if (!R2.configured || input.parts.length === 0) return false;
  const xml = `<CompleteMultipartUpload>${input.parts
    .map(
      (part) =>
        `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${escapeXmlValue(part.etag)}</ETag></Part>`,
    )
    .join("")}</CompleteMultipartUpload>`;
  const { url } = presignUrl({
    method: "POST",
    key: input.key,
    expiresSeconds: 300,
    contentType: "application/xml",
    query: { uploadId: input.uploadId },
  });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/xml" },
      body: xml,
    });
    const responseXml = await res.text();
    // S3 can return HTTP 200 with an XML error while completing multipart.
    return res.ok && !/<Error(?:\s|\/|>)/i.test(responseXml);
  } catch {
    return false;
  }
}

export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  if (!R2.configured) return;
  const { url } = presignUrl({
    method: "DELETE",
    key,
    expiresSeconds: 300,
    query: { uploadId },
  });
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 multipart abort failed with HTTP ${res.status}.`);
  }
}

/** Server-side object verification (never trust the client's claim). */
export async function verifyObjectExists(
  key: string,
): Promise<{ sizeBytes: number; contentType: string | null } | null> {
  if (!R2.configured) return null;
  const { url } = presignUrl({ method: "HEAD", key, expiresSeconds: 60 });
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return null;
    const size = Number(res.headers.get("content-length") ?? NaN);
    if (!Number.isFinite(size)) return null;
    return { sizeBytes: size, contentType: res.headers.get("content-type") };
  } catch {
    return null;
  }
}

/** Delete an R2 object. Missing objects are already in the desired state. */
export async function deleteObject(key: string): Promise<void> {
  if (!R2.configured) return;
  const { url } = presignUrl({ method: "DELETE", key, expiresSeconds: 60 });
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 object deletion failed with HTTP ${res.status}.`);
  }
}

/**
 * Local development fallback.
 *
 * Production media always lives in R2. When R2 credentials are absent (local
 * dev / preview environments) uploads are written to a git-ignored folder so
 * the studio and profile-photo flows stay fully functional. Disabled in
 * production, where a missing storage configuration is reported honestly.
 */
export const LOCAL_UPLOADS_ENABLED = !R2.configured && !IS_PROD;

const LOCAL_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), ".uploads");

function localPath(key: string): string {
  // Keys are server-generated; still normalize to keep writes inside LOCAL_ROOT.
  const safe = key.replace(/\\/g, "/").split("/").filter((part) => part && part !== "..").join("/");
  return path.join(LOCAL_ROOT, safe);
}

export async function writeLocalObject(key: string, data: Buffer): Promise<void> {
  const target = localPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function statLocalObject(key: string): Promise<{ sizeBytes: number } | null> {
  try {
    const info = await stat(localPath(key));
    return info.isFile() ? { sizeBytes: info.size } : null;
  } catch {
    return null;
  }
}

export async function readLocalObject(key: string): Promise<Buffer | null> {
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteLocalObject(key: string): Promise<void> {
  try {
    await unlink(localPath(key));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

/** Delete from whichever backend owns the object's bytes. */
export async function deleteStoredObject(key: string): Promise<void> {
  if (R2.configured) {
    await deleteObject(key);
  } else if (LOCAL_UPLOADS_ENABLED) {
    await deleteLocalObject(key);
  }
}

export const UPLOAD_LIMITS = {
  cover: { maxBytes: 5 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  avatar: { maxBytes: 5 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  video: { maxBytes: 1024 * 1024 * 1024, mimeTypes: ["video/mp4", "video/quicktime", "video/webm"] },
  resource: {
    maxBytes: 500 * 1024 * 1024,
    mimeTypes: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "image/jpeg",
      "image/png",
      "text/csv",
    ],
  },
} as const;

export function formatUploadLimit(maxBytes: number): string {
  const gib = maxBytes / (1024 * 1024 * 1024);
  return Number.isInteger(gib)
    ? `${gib} GB`
    : `${Math.round(maxBytes / (1024 * 1024))} MB`;
}

export function buildStorageKey(input: {
  courseId?: string | null;
  ownerId: string;
  kind: string;
  assetId: string;
  fileName: string;
}): string {
  const safe = input.fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80);
  if (input.courseId) {
    return `courses/${input.courseId}/${input.kind}/${input.assetId}/${safe}`;
  }
  return `${input.kind === "avatar" ? "avatars" : "media"}/${input.ownerId}/${input.assetId}/${safe}`;
}
