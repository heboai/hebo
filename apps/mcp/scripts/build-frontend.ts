/**
 * Pre-build script for frontend assets.
 * This runs during the build phase, NOT at runtime.
 */
import tailwindPlugin from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["src/ui/frontend.tsx"],
  outdir: "./dist",
  minify: process.env.NODE_ENV === "production",
  target: "browser",
  plugins: [tailwindPlugin],
});

if (!result.success) {
  console.error("Frontend build failed:", result.logs);
  throw new Error("Frontend build failed");
}

console.log("✅ Frontend assets built successfully");
