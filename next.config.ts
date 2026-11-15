import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 128, 256, 384, 512],
  },
  async redirects() {
    return [
      {
        source: "/use-cases",
        destination: "/use-cases/education",
        permanent: true,
      },
      {
        source: "/examples",
        destination: "/#examples",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
