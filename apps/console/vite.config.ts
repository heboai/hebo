import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tsconfigPaths(),
      mdx({
        providerImportSource: "~console/mdx-components",
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
    // Dummies to emulate network errors during development if MSW is stopped
    ...(mode === "development" &&
      !env.VITE_API_URL && {
        server: {
          proxy: {
            "/api": {
              target: "https://httpbin.org/status/500",
              changeOrigin: true,
              rewrite: () => "",
            },
            "/gateway": {
              target: "https://httpbin.org/status/500",
              changeOrigin: true,
              rewrite: () => "",
            },
          },
        },
      }),
  };
});
