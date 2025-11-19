import { z } from "zod";

import supportedModels from "@hebo/shared-data/json/supported-models";


export const modelConfigSchema = z.object({
  alias: ((msg) => z.string({ error: msg }).trim().min(1, msg))("Please enter a unique alias name"),
  type: ((msg) => z
    .string({ error: msg})
    .refine((value) => supportedModels.some((model) => model.name === value), msg)
    )("Select one of the supported models")
});

export const modelsConfigFormSchema = z.object({
  models: z.array(modelConfigSchema).optional(),
});

export type ModelsConfigFormValues = z.infer<typeof modelsConfigFormSchema>;
export type ModelConfigFormValue = NonNullable<ModelsConfigFormValues["models"]>[number];

export { supportedModels };
