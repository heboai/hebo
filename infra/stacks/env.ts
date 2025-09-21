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
// Database
export const dbUsername = new sst.Secret("DbUsername", "__UNSET__");
export const dbPassword = new sst.Secret("DbPassword", "__UNSET__");
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
