// Auth
export const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
export const stackPublishableClientKey = new sst.Secret(
  "StackPublishableClientKey",
);
export const stackProjectId = new sst.Secret("StackProjectId");

// LLMs
export const bedrockRoleArn = new sst.Secret("BedrockRoleArn");
export const googleVertexServiceAccountEmail = new sst.Secret(
  "GoogleVertexServiceAccountEmail",
);
export const googleVertexAwsProviderAudience = new sst.Secret(
  "GoogleVertexAwsProviderAudience",
);
export const googleVertexProject = new sst.Secret("GoogleVertexProject");
export const voyageApiKey = new sst.Secret("VoyageApiKey");

export const allSecrets = [
  stackSecretServerKey,
  stackPublishableClientKey,
  stackProjectId,
  bedrockRoleArn,
  googleVertexServiceAccountEmail,
  googleVertexAwsProviderAudience,
  googleVertexProject,
  voyageApiKey,
];
export const isProd = $app.stage === "production";
