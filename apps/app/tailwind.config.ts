import type { Config } from "tailwindcss";
import preset from "./tailwind.preset";

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [preset],
};

export default config;
