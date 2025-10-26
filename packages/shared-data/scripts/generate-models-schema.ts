import { modelsSchema } from "../types/models";

await Bun.write(
  new URL("../json/generated/models.schema.json", import.meta.url),
  JSON.stringify(modelsSchema) + "\n",
);
