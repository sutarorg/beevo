import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
  { protocol: "https", hostname: "**.r2.dev" },
  { protocol: "https", hostname: "**.supabase.co" },
];

const r2PublicBase = (process.env.R2_PUBLIC_BASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
if (r2PublicBase) {
  try {
    const parsed = new URL(
      /^https?:\/\//i.test(r2PublicBase) ? r2PublicBase : `https://${r2PublicBase}`,
    );
    remotePatterns.push({
      protocol: parsed.protocol === "http:" ? "http" : "https",
      hostname: parsed.hostname,
    });
  } catch {
    // Ignore malformed optional R2_PUBLIC_BASE_URL during config load
  }
}

const nextConfig: NextConfig = {
  // Dev-only: allow the proxied preview host to load dev assets/HMR.
  allowedDevOrigins: ["*.e2b.app", "localhost:3000"],
  // The local development database is a WebAssembly build of PostgreSQL — keep
  // it external to the server bundle so its WASM assets resolve at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Keep recently visited routes in the client router cache so switching
    // between tabs/pages is instant instead of refetching every time.
    staleTimes: { dynamic: 30, static: 300 },
  },
  images: {
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/v1/media/access" },
    ],
    remotePatterns,
  },
};

export default nextConfig;
