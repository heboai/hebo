import type { Config } from "tailwindcss";
import { tailwindPreset } from "@hebo/ui";

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [tailwindPreset],
};

export default config;
