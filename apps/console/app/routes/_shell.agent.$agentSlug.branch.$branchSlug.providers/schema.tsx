import z from "zod";

export const BedrockProviderConfigSchema = z.object({
  bedrockRoleArn: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a valid Bedrock ARN role"),
  region: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a valid AWS region"),
});

export const VertexProviderConfigSchema = z.object({
  serviceAccountEmail: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a valid service account email"),
  audience: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a valid audience"),
  location: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a valid location"),
  project: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a valid project"),
});

export const ApiKeyProviderConfigSchema = z.object({
  apiKey: ((msg) => z.string(msg).trim().min(1, msg))("Please enter a valid API key"), 
});

