import { Models } from "../types/models";

await Bun.write(
  new URL("../json/generated/models.schema.json", import.meta.url),
  JSON.stringify(Models) + "\n",
);
