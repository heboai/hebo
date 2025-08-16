import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: "~/mdx-components.tsx",
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
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    devtoolsJson(),
  ],
});
