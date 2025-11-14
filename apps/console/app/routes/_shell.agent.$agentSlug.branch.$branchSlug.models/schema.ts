import {
  array,
  message,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  string,
  trim,
  type InferOutput,
} from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";


export const modelConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter a unique alias name"),
  type: picklist(
    supportedModels.map((model) => model.name),
    "Select one of the supported models",
  )
});

export const modelsConfigFormSchema = object({
  models: pipe(
    optional(array(modelConfigSchema)),
  ),
});

export type ModelsConfigFormValues = InferOutput<typeof modelsConfigFormSchema>;
export type ModelConfigFormValue = NonNullable<ModelsConfigFormValues["models"]>[number];

export { supportedModels };
