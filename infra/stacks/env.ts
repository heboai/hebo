// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);
export const stackProjectId = new sst.Secret("StackProjectId");

// LLMs
export const bedrockRoleArn = new sst.Secret("BedrockRoleArn", "n/a");
export const bedrockRegion = new sst.Secret("BedrockRegion", "n/a");
export const cohereApiKey = new sst.Secret("CohereApiKey", "n/a");
export const groqApiKey = new sst.Secret("GroqApiKey", "n/a");
export const vertexServiceAccountEmail = new sst.Secret(
  "VertexServiceAccountEmail",
  "n/a",
);
export const vertexAwsProviderAudience = new sst.Secret(
  "VertexAwsProviderAudience",
  "n/a",
);
export const vertexProject = new sst.Secret("VertexProject", "n/a");
export const vertexLocation = new sst.Secret("VertexLocation", "n/a");

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
