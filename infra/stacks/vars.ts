// Auth
const _stackSecretServerKey = new sst.Secret("StackSecretServerKey");
const _stackPublishableClientKey = new sst.Secret("StackPublishableClientKey");
const _stackProjectId = new sst.Secret("StackProjectId");

// Database
const _dbUsername = new sst.Secret("DbUsername");
const _dbPassword = new sst.Secret("DbPassword");

// LLMs
const _groqApiKey = new sst.Secret("GroqApiKey");
const _voyageApiKey = new sst.Secret("VoyageApiKey");

const createParameter = (
  name: string,
  secret: sst.Secret,
  isPublic: boolean = false,
) => {
  return new aws.ssm.Parameter(name, {
    name: `/hebo/${$app.stage}/${name}`,
    type: isPublic
      ? aws.ssm.ParameterType.String
      : aws.ssm.ParameterType.SecureString,
    value: secret.value,
    overwrite: true,
  });
};

export const isProd = $app.stage === "production";
export const stackSecretServerKey = createParameter(
  "StackSecretServerKey",
  _stackSecretServerKey,
);
export const stackPublishableClientKey = createParameter(
  "StackPublishableClientKey",
  _stackPublishableClientKey,
  true,
);
export const stackProjectId = createParameter(
  "StackProjectId",
  _stackProjectId,
  true,
);
export const dbUsername = createParameter("DbUsername", _dbUsername, true);
export const dbPassword = createParameter("DbPassword", _dbPassword);
export const groqApiKey = createParameter("GroqApiKey", _groqApiKey);
export const voyageApiKey = createParameter("VoyageApiKey", _voyageApiKey);
