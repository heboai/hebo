// Auth
export const stackProjectId = new sst.Secret("StackProjectId");
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);

// Database
export const dbUsername = new sst.Secret("DbUsername");
export const dbPassword = new sst.Secret("DbPassword");

// LLMs
export const groqApiKey = new sst.Secret("GroqApiKey");
export const voyagerApiKey = new sst.Secret("VoyagerApiKey");
