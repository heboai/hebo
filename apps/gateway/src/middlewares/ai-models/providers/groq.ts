import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

export const getGroqDefaultConfig = async () => ({
  apiKey: await getSecret("GroqApiKey"),
});
export const createGroqProvider = async (cfg: ApiKeyProviderConfig) =>
  createGroq({ ...cfg });
export const transformGroqModelId = async (id: string) => {
  return id;
};
