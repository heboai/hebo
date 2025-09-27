import { defineConfig } from "prisma/config";
import { Resource } from "sst";

export const connectionString = (() => {
  try {
    // TODO: this is probably wrong, fix it!
    return Resource.HeboDatabase.connectionString;
  } catch {
    return "postgresql://postgres:password@localhost:5432/local";
  }
})();

process.env.DATABASE_URL = connectionString;

export default defineConfig({
  schema: "./prisma/schema.prisma",
});
