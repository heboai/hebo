import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  transpilePackages: ["@hebo/ui"],
  productionBrowserSourceMaps: true,
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // Ensure static generation works properly
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },
};

export default nextConfig;
