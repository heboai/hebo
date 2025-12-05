import { DEFAULT_RATE_LIMIT, defineModel } from "./base";

export const COHERE_EMBED_V4 = defineModel({
  type: "cohere/embed-v4.0",
  displayName: "Cohere Embed v4.0",
  family: "cohere",
  rateLimit: DEFAULT_RATE_LIMIT,
  providers: [
    {
      cohere: "embed-v4.0",
    },
  ],
  modality: "embedding",
});
