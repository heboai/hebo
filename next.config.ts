import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  webpack: (config, { dev }) => {
    // Enable source maps in development
    if (dev) {
      config.devtool = 'source-map';
    }
    return config;
  },
};

export default nextConfig;
