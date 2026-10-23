/**
 * Shared environment string & PostgreSQL URL normalizer (safe in both Next.js
 * server runtime and standalone CLI scripts like drizzle-kit / seed).
 */

export function cleanEnv(raw: string | undefined): string {
  if (!raw) return "";
  let value = raw.replace(/\u00a0/g, " ").trim();
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

const MANAGED_SSL_HOST_SUFFIXES = [
  ".supabase.com",
  ".supabase.co",
  ".neon.tech",
  ".railway.app",
  ".render.com",
];

/**
 * Normalizes a PostgreSQL connection string for `pg` v8.20+:
 *  - strips accidental leading/trailing whitespace & quotes (which otherwise
 *    cause `pg-connection-string` to misparse the hostname as `"base"`),
 *  - enables `uselibpqcompat=true` when `sslmode` is `require` or `prefer`
 *    (without a custom `sslrootcert`), so `pg` uses standard libpq TLS
 *    semantics instead of failing with `SELF_SIGNED_CERT_IN_CHAIN` against
 *    managed poolers like Supabase Supavisor (`*.pooler.supabase.com`).
 */
export function normalizeDatabaseUrl(raw: string | undefined): string {
  const cleaned = cleanEnv(raw);
  if (!cleaned) return "";

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      return cleaned;
    }

    const host = parsed.hostname.toLowerCase();
    const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
    const isManagedCloud = MANAGED_SSL_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
    const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();
    const hasRootCert =
      parsed.searchParams.has("sslrootcert") || Boolean(cleanEnv(process.env.PGSSLROOTCERT));

    if (!isLocal && !sslmode && isManagedCloud) {
      parsed.searchParams.set("sslmode", "require");
    }

    const effectiveSslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
    if (
      (effectiveSslMode === "require" || effectiveSslMode === "prefer") &&
      !parsed.searchParams.has("uselibpqcompat") &&
      !hasRootCert
    ) {
      parsed.searchParams.set("uselibpqcompat", "true");
    }

    return parsed.toString();
  } catch {
    return cleaned;
  }
}
