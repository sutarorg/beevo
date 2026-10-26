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
  // Never advertise the framework version in responses.
  poweredByHeader: false,
  // Canonical URLs never carry a trailing slash (`/pricing`, not `/pricing/`).
  trailingSlash: false,
  // Dev-only: allow the proxied preview host to load dev assets/HMR.
  allowedDevOrigins: ["*.e2b.app", "localhost:3000"],
  // The local development database is a WebAssembly build of PostgreSQL — keep
  // it external to the server bundle so its WASM assets resolve at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Keep recently visited routes in the client router cache so switching
    // between tabs/pages is instant instead of refetching every time.
    staleTimes: { dynamic: 30, static: 300 },
    // Tree-shake the two big icon/animation packages down to what's used.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    // Modern formats first: AVIF/WebP are dramatically smaller than the
    // source JPEG/PNG files on slow mobile connections.
    formats: ["image/avif", "image/webp"],
    // Optimized variants may be reused for a month (covers/avatars change
    // rarely; the optimizer still revalidates the source afterwards).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/v1/media/access" },
    ],
    remotePatterns,
  },
  async redirects() {
    return [
      // Canonical dashboard URLs: these index routes used to answer 307 from a
      // page component. A permanent 308 tells crawlers and bookmarks the real
      // destination.
      { source: "/creator", destination: "/creator/dashboard", permanent: true },
      { source: "/learn", destination: "/learn/courses", permanent: true },
      { source: "/admin", destination: "/admin/dashboard", permanent: true },
      // Legacy static path: /blog is the one canonical location for the guides.
      { source: "/blog.html", destination: "/blog", permanent: true },
    ];
  },
  async headers() {
    const privateNoIndex = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    const baseSecurityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Discovery files: let CDNs absorb traffic but revalidate quickly so
        // new courses appear promptly.
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
      // Defense in depth alongside the layout-level `robots` metadata: even a
      // cached or accidentally linked private URL cannot be indexed.
      { source: "/creator/:path*", headers: privateNoIndex },
      { source: "/learn/:path*", headers: privateNoIndex },
      { source: "/admin/:path*", headers: privateNoIndex },
      { source: "/login", headers: privateNoIndex },
      { source: "/signup", headers: privateNoIndex },
      { source: "/forgot-password", headers: privateNoIndex },
      { source: "/forgot-password/:path*", headers: privateNoIndex },
      { source: "/api/:path*", headers: baseSecurityHeaders },
      { source: "/:path*", headers: baseSecurityHeaders },
    ];
  },
};

export default nextConfig;
