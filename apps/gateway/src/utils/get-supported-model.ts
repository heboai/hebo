import supportedModels from "@hebo/shared-data/json/supported-models";

import { BadRequestError } from "~gateway/middlewares/providers/errors";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

export const getSupportedModelOrThrow = (
  type: string,
  modality?: "chat" | "embedding" | undefined,
) => {
  const model = supportedModels.find((m) => m.name === type);
  if (!model)
    throw new BadRequestError(
      `Unknown or unsupported model '${type}'`,
      "model_unsupported",
    );
  if (modality && model.modality !== modality)
    throw new BadRequestError(
      `Model '${type}' is a ${model.modality} model, not a ${modality} model`,
      "model_mismatch",
    );
  return model;
};
