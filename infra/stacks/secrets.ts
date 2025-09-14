// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");

// Database
export const dbUsername = new sst.Secret("DbUsername");
export const dbPassword = new sst.Secret("DbPassword");

// LLMs
export const groqApiKey = new sst.Secret("GroqApiKey");
export const voyageApiKey = new sst.Secret("VoyageApiKey");
