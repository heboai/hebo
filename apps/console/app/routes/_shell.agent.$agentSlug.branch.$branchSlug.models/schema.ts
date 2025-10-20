import {
  array,
  literal,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  string,
  trim,
  union,
  url as urlRule,
  type InferOutput,
} from "valibot";

import supportedModels from "@hebo/shared-data/json/supported-models";


export const endpointManagedSchema = object({
  mode: literal("managed"),
  baseUrl: optional(pipe(string(), trim())),
  apiKey: optional(pipe(string(), trim())),
});

export const endpointCustomSchema = object({
  mode: literal("custom"),
  baseUrl: pipe(
    string(),
    trim(),
    nonEmpty("Enter the endpoint base URL"),
    urlRule("Enter a valid URL (https://example.com)"),
  ),
  apiKey: pipe(string(), trim(), nonEmpty("Provide the API key")),
});

export const branchModelSchema = object({
  alias: pipe(string(), trim(), nonEmpty("Alias is required")),
  type: picklist(
    supportedModels.map((model) => model.name),
    "Select one of the supported models",
  ),
  endpoint: union([endpointManagedSchema, endpointCustomSchema]),
});

export const branchModelsFormSchema = object({
  models: pipe(
    array(branchModelSchema),
    minLength(1, "Add at least one model to the branch"),
  ),
});

export type BranchModelsFormValues = InferOutput<typeof branchModelsFormSchema>;
export type BranchModelFormValue = BranchModelsFormValues["models"][number];

export const EMPTY_MODEL: BranchModelFormValue = {
  alias: "",
  type: supportedModels[0].name,
  endpoint: {
    mode: "managed",
    baseUrl: "",
    apiKey: "",
  },
};

export { supportedModels };
