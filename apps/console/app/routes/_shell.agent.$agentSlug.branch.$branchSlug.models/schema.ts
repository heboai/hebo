import {
  array,
  message,
  minLength,
  nonEmpty,
  object,
  picklist,
  pipe,
  string,
  trim,
  type InferOutput,
} from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";


export const modelConfigSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter an alias name"),
  type: picklist(
    supportedModels.map((model) => model.name),
    "Select one of the supported models",
  )
});

export const modelsConfigFormSchema = object({
  models: pipe(
    array(modelConfigSchema),
    minLength(1, "Add at least one model to the branch"),
  ),
});

export type ModelsConfigFormValues = InferOutput<typeof modelsConfigFormSchema>;
export type ModelConfigFormValue = ModelsConfigFormValues["models"][number];

export { supportedModels };
