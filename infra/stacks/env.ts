// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);
export const stackProjectId = new sst.Secret("StackProjectId");

// LLMs
export const awsAccessKeyId = new sst.Secret("AWSAccessKeyId");
export const awsSecretAccessKey = new sst.Secret("AWSSecretAccessKey");
export const googleVertexServiceAccount = new sst.Secret(
  "GoogleVertexServiceAccount",
);
export const googleVertexProject = new sst.Secret("GoogleVertexProject");
export const groqApiKey = new sst.Secret("GroqApiKey");
export const voyageApiKey = new sst.Secret("VoyageApiKey");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  awsAccessKeyId,
  awsSecretAccessKey,
  googleVertexServiceAccount,
  googleVertexProject,
  groqApiKey,
  voyageApiKey,
];
export const isProd = $app.stage === "production";
