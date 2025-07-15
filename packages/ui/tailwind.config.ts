import type { Config } from "tailwindcss";
import preset from "./tailwind.preset";

const config: Pick<Config, "prefix" | "presets"> = {
  prefix: "ui-",
  presets: [preset],
};

export default config; 