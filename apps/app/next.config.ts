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

// I'm currently not able to make this work with turbopack
const withMDX = createMDX({
  options: {
    rehypePlugins: [
      [
        rehypeShiki,
        {
          theme: "vitesse-light",
          langs: ["ts", "python", "bash"],
          // Add code block metadata as HTML attributes
          addLanguageClass: true,
          parseMetaString: (str: string): Record<string, string | boolean> =>
            Object.fromEntries(
              [...str.matchAll(/([a-zA-Z0-9]+)(?:=(?:"([^"]*)"|([^\s]+)))?/g)].map(
                ([, key, quoted, unquoted]) => [key, quoted ?? unquoted ?? true]
              )
            )
        }
      ]
    ]
  }
});

export default withMDX(nextConfig);
