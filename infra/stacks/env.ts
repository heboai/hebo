// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);
export const stackProjectId = new sst.Secret("StackProjectId");

// LLMs
export const accessKeyId = new sst.Secret("AWSAccessKeyId");
export const secretAccessKey = new sst.Secret("AWSSecretAccessKey");
export const bedrockInferenceProfile = new sst.Secret(
  "BedrockInferenceProfile",
);
export const googleVertexServiceAccount = new sst.Secret(
  "GoogleVertexServiceAccount",
);
export const googleVertexProject = new sst.Secret("GoogleVertexProject");
export const voyageApiKey = new sst.Secret("VoyageApiKey");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  accessKeyId,
  secretAccessKey,
  bedrockInferenceProfile,
  googleVertexServiceAccount,
  googleVertexProject,
  voyageApiKey,
];
export const isProd = $app.stage === "production";
