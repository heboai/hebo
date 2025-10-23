import {
  array,
  message,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  string,
  trim,
  url as urlRule,
  type InferOutput,
} from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";


export const branchModelSchema = object({
  alias: message(pipe(string(), trim(), nonEmpty()), "Please enter an alias name"),
  type: picklist(
    supportedModels.map((model) => model.name),
    "Select one of the supported models",
  ),
  endpoint: optional(
    object({
      baseUrl: 
        message(
          pipe(
            string(),
            trim(),
            nonEmpty(),
            urlRule()
          ), 
          "Enter a valid URL (https://example.com)",
      ),
      apiKey: message(pipe(string(), trim(), nonEmpty()), "Provide the API key"),
    }),
  ),
});

export const branchModelsFormSchema = object({
  models: pipe(
    array(branchModelSchema),
    minLength(1, "Add at least one model to the branch"),
  ),
});

export type BranchModelsFormValues = InferOutput<typeof branchModelsFormSchema>;
export type BranchModelFormValue = BranchModelsFormValues["models"][number];

export { supportedModels };
