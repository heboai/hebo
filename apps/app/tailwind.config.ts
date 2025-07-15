import type { Config } from "tailwindcss";
import uiPreset from "@hebo/ui";

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [uiPreset],
};

export default config;
