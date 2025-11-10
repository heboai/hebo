// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);
export const stackProjectId = new sst.Secret("StackProjectId");

// LLMs
export const bedrockRoleArn = new sst.Secret("BedrockRoleArn");
export const groqApiKey = new sst.Secret("GroqApiKey");
export const vertexServiceAccountEmail = new sst.Secret(
  "VertexServiceAccountEmail",
);
export const vertexAwsProviderAudience = new sst.Secret(
  "VertexAwsProviderAudience",
);
export const vertexProject = new sst.Secret("VertexProject");
export const voyageApiKey = new sst.Secret("VoyageApiKey");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  bedrockRoleArn,
  groqApiKey,
  vertexServiceAccountEmail,
  vertexAwsProviderAudience,
  vertexProject,
  voyageApiKey,
];
export const isProd = $app.stage === "production";
