import createMDX from "@next/mdx";
import rehypeShiki from "@shikijs/rehype";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Support Type Script and Markdown pages
  pageExtensions: ["mdx", "ts", "tsx"],
  // Enable transpile packages for ui lib
  transpilePackages: ["@hebo/ui", "@hebo/api"],
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

const withMDX = createMDX({
  options: {
    rehypePlugins: [
      [
        // FUTURE: Get turbopack compatible plugin style working
        // https://nextjs.org/docs/app/guides/mdx#using-plugins-with-turbopack
        // @heiwen will submit a patch to @shikijs/rehype
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
