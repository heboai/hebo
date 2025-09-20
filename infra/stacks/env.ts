// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
  "",
);
export const stackProjectId = new sst.Secret("StackProjectId");
// Database
export const dbUsername = new sst.Secret("DbUsername");
export const dbPassword = new sst.Secret("DbPassword");
// LLMs
export const groqApiKey = new sst.Secret("GroqApiKey");
export const voyageApiKey = new sst.Secret("VoyageApiKey");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  dbUsername,
  dbPassword,
  groqApiKey,
  voyageApiKey,
];
export const isProd = $app.stage === "production";
