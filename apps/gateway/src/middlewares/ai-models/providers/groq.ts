import { createGroq } from "@ai-sdk/groq";

import { getSecret } from "@hebo/shared-api/utils/secrets";
import type { ApiKeyProviderConfig } from "@hebo/shared-data/types/providers";

export const getGroqDefaultConfig = async () => ({
  apiKey: await getSecret("GroqApiKey"),
});
export const createGroqProvider = async (cfg: ApiKeyProviderConfig) =>
  createGroq({ ...cfg });
export const transformGroqModelId = async (id: string) => {
  return id;
};
