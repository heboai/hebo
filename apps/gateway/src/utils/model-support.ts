import supportedModels from "@hebo/shared-data/json/supported-models";

import { BadRequestError } from "~gateway/middlewares/provider/errors";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

export const getModalityOrThrow = (type: string) => {
  const entry = supportedModels.find((m) => m.name === type);
  if (!entry)
    throw new BadRequestError(
      `Unknown or unsupported model '${type}'`,
      "model_unsupported",
    );
  return entry.modality;
};
