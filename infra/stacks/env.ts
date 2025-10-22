// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);
export const stackProjectId = new sst.Secret("StackProjectId");

// LLMs
export const bedrockApiKey = new sst.Secret("BedrockApiKey");
export const groqApiKey = new sst.Secret("GroqApiKey");
export const voyageApiKey = new sst.Secret("VoyageApiKey");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  bedrockApiKey,
  groqApiKey,
  voyageApiKey,
];
export const isProd = $app.stage === "production";
