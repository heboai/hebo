import type { NextConfig } from "next";

import createMDX from "@next/mdx";
import rehypeShiki from "@shikijs/rehype";

const nextConfig: NextConfig = {
  output: "export",
  // Support Type Script and Markdown pages
  pageExtensions: ["mdx", "ts", "tsx"],
  // Enable transpile packages for ui lib
  transpilePackages: ["@hebo/ui"],
  experimental: {
    // Enable page transitions via react
    viewTransition: true,
  },
  // Ensure static generation works properly
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

// FUTURE: Use turbopack compatible plugin style
const withMDX = createMDX({
  options: {
    rehypePlugins: [
      [
        rehypeShiki,
        {
          theme: "vitesse-light",
          langs: ["bash", "python", "ts"],
          // Add code block metadata as HTML attributes
          addLanguageClass: true,
          parseMetaString: (str: string): Record<string, string> => ({
            title: str.trim(),
          }),
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
