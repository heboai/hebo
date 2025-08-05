import { defineConfig } from "drizzle-kit";
import { getDrizzleConfig } from "./utils";

const dbConfig = getDrizzleConfig();

export default defineConfig({
  dialect: "postgresql",
  schema: [`./schema`],
  out: `./migrations`,
  ...dbConfig,
});
