// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);
export const stackProjectId = new sst.Secret("StackProjectId");

// LLMs
export const bedrockRoleArn = new sst.Secret("BedrockRoleArn");
export const bedrockRegion = new sst.Secret("BedrockRegion");
export const cohereApiKey = new sst.Secret("CohereApiKey");
export const groqApiKey = new sst.Secret("GroqApiKey");
export const vertexServiceAccountEmail = new sst.Secret(
  "VertexServiceAccountEmail",
);
export const vertexAwsProviderAudience = new sst.Secret(
  "VertexAwsProviderAudience",
);
export const vertexProject = new sst.Secret("VertexProject");
export const vertexLocation = new sst.Secret("VertexLocation");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  bedrockRoleArn,
  bedrockRegion,
  cohereApiKey,
  groqApiKey,
  vertexServiceAccountEmail,
  vertexAwsProviderAudience,
  vertexProject,
  vertexLocation,
];
export const isProd = $app.stage === "production";
