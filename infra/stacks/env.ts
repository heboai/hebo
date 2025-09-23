// Auth
export const stackSecretServerKey = new sst.Secret(
  "StackSecretServerKey",
  "__UNSET__",
);
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
  "__UNSET__",
);
export const stackProjectId = new sst.Secret("StackProjectId", "__UNSET__");

// LLMs
export const groqApiKey = new sst.Secret("GroqApiKey");
export const voyageApiKey = new sst.Secret("VoyageApiKey");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  groqApiKey,
  voyageApiKey,
];
export const isProd = $app.stage === "production";
