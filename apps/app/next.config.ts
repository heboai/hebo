import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Enable transpile packages for ui lib
  transpilePackages: ["@hebo/ui"],
  experimental: {
    esmExternals: true,
    // Enable page transitions via react
    viewTransition: true,
  },
  // Ensure static generation works properly
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
