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
  images: {
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/v1/media/access" },
    ],
    remotePatterns,
  },
};

export default nextConfig;
