import { createHash, createHmac } from "node:crypto";
import { R2 } from "@/server/env";

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
 *  - bucket CORS must allow the app origin for PUT/GET/HEAD with content-type.
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
  method: "PUT" | "GET" | "HEAD" | "DELETE";
  key: string;
  expiresSeconds: number;
  contentType?: string;
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

/** Cleanup for failed/abandoned uploads — best-effort delete. */
export async function deleteObject(key: string): Promise<void> {
  if (!R2.configured) return;
  const { url } = presignUrl({ method: "DELETE", key, expiresSeconds: 60 });
  try {
    await fetch(url, { method: "DELETE" }).catch(() => {});
  } catch {
    // ignored — cleanup is best-effort
  }
}

export const UPLOAD_LIMITS = {
  cover: { maxBytes: 5 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  video: { maxBytes: 500 * 1024 * 1024, mimeTypes: ["video/mp4", "video/quicktime", "video/webm"] },
  resource: {
    maxBytes: 50 * 1024 * 1024,
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

export function buildStorageKey(input: {
  courseId: string;
  kind: string;
  assetId: string;
  fileName: string;
}): string {
  const safe = input.fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80);
  return `courses/${input.courseId}/${input.kind}/${input.assetId}/${safe}`;
}
