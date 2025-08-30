import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  plugins: [
    tsconfigPaths(),
    mdx({
      providerImportSource: "~/mdx-components",
      rehypePlugins: [
        [
          rehypeShiki,
          {
            theme: "vitesse-light",
            langs: ["bash", "python", "ts"],
            // Add code block metadata as HTML attributes
            addLanguageClass: true,
            parseMetaString: (meta: string): Record<string, string> =>
              meta ? { title: meta.trim() } : {},
          },
        ],
      ],
    }),
    tailwindcss(),
    reactRouter(),
    ...(mode === "development" ? [devtoolsJson()] : []),
  ],
  optimizeDeps: {
    exclude: ["@hebo/ui", "@hebo/shared-data", "@hebo/api"],
  },
}));
